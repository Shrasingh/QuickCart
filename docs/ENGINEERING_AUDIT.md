# QuickCart — Engineering Audit

**Date:** 2026-10-28
**Repository:** `C:\Users\shraddha\Desktop\TEST\TEST\QuickCart` → <https://github.com/Shrasingh/QuickCart> (public, default branch `main`)
**Scope:** read-only inspection of the working tree, git history, remote, CI config, the live deployment, and the sibling admin API (`../EcommerceCloud`) that QuickCart depends on.

Everything in this document is one of: **verified** (observed in code, git, or a live request), **inferred** (reasonable conclusion from evidence), or **proposed** (not yet done). Each finding is labelled.

---

## 1. Executive summary

QuickCart is a small (~2.4k lines), coherent Next.js 16 / React 19 storefront that consumes the EcommerceCloud admin REST API. The core user journey — browse → filter/search → product detail → cart → Stripe Checkout → order-received page — is implemented end to end, and the live deployment at <https://quick-cart-eta-ecru.vercel.app> renders a seeded catalog (verified 2026-10-28, HTTP 200).

Baseline on the current working tree (which includes uncommitted work from a previous session):

| Check | Result |
|---|---|
| `npm run lint` | pass, **5 warnings** (`react-hooks/set-state-in-effect`, all from the `isMounted` pattern) |
| `npm run typecheck` | pass |
| `npm test` | pass, 19 tests in 3 files |
| `npm run build` | pass (Next 16.4.3, all routes dynamic) |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit` (incl. dev) | 3 (2 critical, 1 moderate) — all in `vitest`/`tinypool`, dev-only |

The three things an Amazon reviewer would notice first:

1. **No validation gate between a developer's laptop and production.** Vercel deploys every push to `main` to production (verified via the GitHub deployments API: `vercel[bot]`, environment `Production`, for every commit). `main` is unprotected and no GitHub Actions run has ever executed (the CI workflow exists only as an untracked local file).
2. **Honest-but-thin reliability around checkout.** The checkout button can be clicked repeatedly (each click creates a new unpaid order in the admin DB and a new Stripe session), the server's specific 4xx error messages are discarded in favour of a generic toast, and server-side `fetch` calls have no timeout.
3. **Small correctness gaps** that are cheap to fix: the image fallback `/placeholder.svg` does not exist (404), "Related products" includes the product being viewed, pages fetch sequentially instead of in parallel, icon buttons have no accessible names.

Git attribution is in a **good state on the remote**: all 9 commits on `origin/main` are authored by `Shraddha Singh <shra192002@gmail.com>` (linked to GitHub `Shrasingh`) or `Shivang Tripathi` (linked to `shivang-tripati`). No Claude co-author trailers and no `shraddhasingh-cfc` commits exist on the remote. The only risk is the **global** git identity on this machine, which is the work account and would leak into any new clone. Details in §8.

---

## 2. Architecture overview (verified)

```
┌──────────────────────────────┐        HTTPS (public, read-only)        ┌──────────────────────────────┐
│  QuickCart (this repo)       │ ──── GET /api/{storeId}/products ─────▶ │  EcommerceCloud (admin)      │
│  Next.js 16 App Router       │      GET /categories, /sizes, /colors   │  Next.js 16 + Prisma         │
│  Vercel                      │      GET /billboards                    │  PostgreSQL (Neon)           │
│                              │                                         │  Clerk auth (admin only)     │
│  Server components fetch     │ ──── POST /api/{storeId}/checkout ────▶ │  creates Order (isPaid=false)│
│  Client: zustand cart in     │      { productIds }                     │  creates Stripe session      │
│  localStorage                │ ◀──── { url: stripe checkout } ────────│                              │
└──────────────┬───────────────┘                                         └──────────────┬───────────────┘
               │ browser redirect                                                       │ webhook
               ▼                                                                        ▼
        Stripe Checkout ──(success_url)──▶ /order-success?orderId=…          Stripe → /api/webhook
                        ──(cancel_url)───▶ /cart?canceled=1                  marks order paid, archives products
```

- **QuickCart has no database and no authentication.** It is a pure consumer of the admin API. `NEXT_PUBLIC_API_URL` = `<admin-origin>/api/<storeId>` selects the store.
- **Rendering model:** every page exports `revalidate = 0` and the root layout fetches categories per request, so all routes are server-rendered on demand (confirmed by `next build` output: all `ƒ`).
- **Client state:** two zustand stores persisted to `localStorage`: `cart-storage` (full `Product` objects) and `quickcart-orders` (guest order ids + timestamps). A third, non-persisted store drives the preview modal.
- **Payment:** the storefront never touches Stripe keys. It POSTs product ids; the admin prices them server-side, creates the order, and returns a Stripe-hosted URL. Payment confirmation happens asynchronously via the admin's webhook; the storefront cannot observe it.

### Module boundaries

| Area | Files | Notes |
|---|---|---|
| Data access (server) | `actions/get-*.tsx` (8 files) | Near-identical `fetch` wrappers; return `[]`/`null` on any failure. No timeout. URL built at module load from env. |
| Routes | `app/(routes)/**` | Home, `/products` (search + filters), `/category/[id]`, `/product/[id]`, `/cart`, `/orders`, `/order-success`; plus `loading.tsx`, `not-found.tsx`. |
| Pure logic | `lib/filters.ts` (uncommitted), `lib/utils.ts` | URL/query helpers extracted for unit testing. |
| Client state | `hooks/use-cart.ts`, `hooks/use-orders.ts`, `hooks/use-preview-model.ts` | zustand. |
| UI | `components/**` | Navbar (server component), search bar, filters, product card/list, gallery, modal, `ui/*` primitives. |
| Tests | `tests/*.test.ts`, `tests/setup.ts`, `vitest.config.ts` (since renamed to `vitest.config.mts`; all uncommitted) | Node-environment logic tests only; no component rendering, no E2E. |
| CI | `.github/workflows/ci.yml` (uncommitted) | lint → typecheck → test → build on push/PR to `main`. Never executed on GitHub yet. |

---

## 3. Feature inventory

| Feature | Status | Evidence |
|---|---|---|
| Home: hero billboard (configurable via `NEXT_PUBLIC_HOME_BILLBOARD_ID`) + featured products | **Implemented, deployed** | `app/(routes)/page.tsx`; live site renders it |
| Category navigation in navbar | Implemented, deployed | `components/navbar.tsx`, `main-nav.tsx`; 8 category links on the live site |
| Category page with size/color/price filters, URL-synced, mobile drawer | Implemented, deployed | `app/(routes)/category/[categoryId]/**`, `components/price-filter.tsx` |
| Search (`/products?q=`) | Implemented, deployed | `components/search-bar.tsx`, `app/(routes)/products/page.tsx`; admin API `buildProductWhere` does a case-insensitive match on name/brand/description/category (verified in `../EcommerceCloud/lib/products.ts`) |
| Price-range filter | Implemented, deployed | admin `productQuerySchema` accepts `minPrice`/`maxPrice` and rejects min > max (verified) |
| Product detail + gallery + related products | Implemented, deployed | `app/(routes)/product/[productId]/page.tsx` |
| Quick-preview modal | Implemented, deployed | `components/preview-model.tsx`, `providers/modal-provider.tsx` |
| Cart (add once per product, remove, clear; persisted) | Implemented, tested, deployed | `hooks/use-cart.ts`, `tests/use-cart.test.ts` |
| Checkout → Stripe | Implemented, deployed (test keys) | `app/(routes)/cart/components/summary.tsx`; admin `checkout/route.ts` |
| Order-received page, cancel handling | Implemented, deployed | `order-success-content.tsx`, `summary.tsx` |
| Guest order list (`/orders`) | Implemented (local-only) | `hooks/use-orders.ts`; status is always "Processing" because the admin exposes no public order-status endpoint |
| Out-of-stock / discount badges | Implemented | `product-card.tsx`, `ui/info.tsx` (fields are optional in `type.ts`) |
| Loading skeleton, 404, empty states | Implemented | `loading.tsx`, `not-found.tsx`, `ui/no-results.tsx` |
| Quantity per line item | **Not implemented** | Cart holds each product once (mirrors the admin, which archives a product once sold — single-unit inventory model) |
| Account / order history across devices | **Not implemented** | By design: no auth in the storefront |
| Search on mobile | **Not implemented** | `search-bar.tsx` is `hidden md:flex` |
| Payment status on `/orders` | **Not implemented** | No API for it |

---

## 4. Important source files

- `app/(routes)/cart/components/summary.tsx` — the only write path (checkout POST). Highest-risk file.
- `app/(routes)/order-success/order-success-content.tsx` — clears the cart, records the guest order; trusts the `orderId` query param only as a label (nothing is authorised by it).
- `actions/get-products.tsx` — the main catalog query; all filters flow through it.
- `hooks/use-cart.ts` — persisted cart store.
- `lib/filters.ts` — pure, tested URL logic.
- `app/layout.tsx` — per-request rendering, metadata, providers.
- `.github/workflows/ci.yml`, `vitest.config.ts` (now `.mts`), `tests/*` — quality gates (uncommitted).

---

## 5. Test and CI baseline (verified)

- **Unit tests:** 19 passing (`lib/filters.ts` ×11, `hooks/use-cart.ts` ×4, `actions/get-products.tsx` ×4 with `fetch` mocked). Deterministic, node-only, no network.
- **Not covered:** cart total calculation, checkout request/error handling, any React rendering, any end-to-end journey.
- **CI:** the workflow file is correct and uses a placeholder API URL for the build. It has never run because it is not committed. No branch protection exists, so even once pushed it would not block merges.
- **Lint:** 5 warnings, all the deliberate `isMounted` hydration pattern; the ESLint config downgrades the rule to `warn` to accommodate it.

---

## 6. Prioritized findings

Severity: **High** = incorrect behaviour / data or money impact / deployment risk; **Medium** = reliability, UX correctness, maintainability; **Low** = polish.

### High

| # | Finding | Evidence | Impact | Status |
|---|---|---|---|---|
| H1 | **Every push to `main` deploys straight to production with no checks.** | GitHub deployments API shows `vercel[bot]` Production deployments for every commit, including `65dc245` (a commit later force-pushed away). No Actions runs, `main` unprotected, CI workflow uncommitted. | A broken commit reaches the live demo immediately. This is exactly the dev/QA/prod separation the Amazon reviewer flagged. | Verified. Remediation in `docs/DEPLOYMENT_WORKFLOW.md` (commit CI; protect `main`; use Vercel Preview for PRs with a non-production store). Branch protection needs your GitHub settings. |
| H2 | **Checkout has no duplicate-submission guard.** | `summary.tsx` `onCheckout` has no in-flight state; the button stays enabled until `window.location` changes. | Each extra click creates another unpaid `Order` row and Stripe session in the admin DB (verified in the admin `checkout/route.ts`: the order is created before the session). Pollutes the orders list and revenue estimates. | Verified. Fix: disable the button and show "Redirecting…" while the request is pending. |
| H3 | **Missing `/placeholder.svg`.** | `public/` contains only `next.svg` and `vercel.svg`; `product-card.tsx:54` and `cart-item.tsx:26` fall back to `/placeholder.svg`. | Any product with no images renders a broken image (404) — and the admin allows products with zero images. | Verified. Fix: add the asset. |

### Medium

| # | Finding | Evidence | Impact | Status |
|---|---|---|---|---|
| M1 | Server `fetch` calls have no timeout. | all `actions/get-*.tsx` | If the admin API hangs, every page render hangs until the platform kills it (Vercel function timeout). | Verified. Fix: shared `fetchJson` with `AbortSignal.timeout`. |
| M2 | Sequential data fetching (waterfalls). | `category/[categoryId]/page.tsx` awaits products → sizes → colors → category; `products/page.tsx` 3 sequential; `product/[productId]` 2 sequential (the second depends on the first). | Page latency = sum of API latencies rather than max. | Verified. Fix: `Promise.all` for the independent requests (the 404 check on category still happens before rendering). |
| M3 | Checkout error messages are discarded. | `summary.tsx` catch → generic toast. The admin returns specific 400s ("Some items in your cart are no longer available…", "Order total must be at least…") and 503 for config errors (verified in admin). | The user can't tell what to fix. | Verified. Fix: surface the server message for 4xx; generic for 5xx/network. |
| M4 | "Related Products" includes the current product. | `product/[productId]/page.tsx` filters only by `categoryId`. | Confusing UX. | Verified. Fix: exclude `product.id`. |
| M5 | Missing `NEXT_PUBLIC_API_URL` fails silently. | URL becomes `"undefined/products"`; actions swallow the error and return `[]`. | Empty storefront with no diagnostic. Hard to onboard. | Verified. Fix: a single env accessor that logs a clear error once. |
| M6 | `.env.example` omits `NEXT_PUBLIC_SITE_URL`. | `app/layout.tsx` reads it; README mentions it; the example does not. | Wrong Open Graph URLs in production if forgotten. | Verified. Fix: add to the example. |
| M7 | Accessibility: icon-only buttons have no accessible name; the product card is a clickable `div`. | `ui/icon-button.tsx` has no `aria-label`; `product-card.tsx` `div onClick`. | Screen-reader users can't identify preview/add/remove/close; keyboard users can't open a product from the grid. | Verified. Fix: `aria-label` prop; keyboard-operable card. |
| M8 | 5 lint warnings from the `isMounted` pattern; rule downgraded in the ESLint config. | `currency.tsx`, `navbar-actions.tsx`, `cart/page.tsx`, `orders/page.tsx`, `modal-provider.tsx` | Noise in CI; reviewers see a disabled rule. | Verified. Fix: `useHydrated()` via `useSyncExternalStore` (the React-recommended approach), then restore the rule. |
| M9 | Dev-only vulnerable deps (`vitest` 3 → `tinypool`, `@vitest/mocker`). | `npm audit`: 2 critical, 1 moderate; `--omit=dev` is clean. | Not shipped to users, but a red "critical" in audit output looks bad. | Verified. Fix: upgrade to vitest 5 (dev only) if tests still pass. |
| M10 | Cart total is computed with floating-point `Number(price)` sums and is untested. | `summary.tsx` reduce. | Display-only (the server re-prices), but artefacts like 0.1+0.2 can appear; no test guards it. | Verified. Fix: `lib/cart.ts` `cartTotal` in integer cents + tests. |

### Low

| # | Finding | Evidence | Status |
|---|---|---|---|
| L1 | GitHub repo "homepage" points to <https://quickcart-six.vercel.app>, which serves an unrelated "QuickCart - GreatStack" site. The real demo is <https://quick-cart-eta-ecru.vercel.app>. | GitHub API `homepage` field; curl of both. | Needs your action in GitHub repo settings. |
| L2 | README links `../EcommerceCloud` (a relative path that 404s on GitHub). | `README.md` | Fix in the README rewrite. |
| L3 | `package.json` name is `ecommerce-store`. | | Cosmetic; left unchanged (would churn the lockfile). |
| L4 | Search bar hidden on mobile; navbar categories don't wrap/scroll on narrow screens. | `search-bar.tsx`, `main-nav.tsx` | Documented as a known limitation; not changed (UI scope). |
| L5 | `window.location = response.data.url` without checking it is an `https:` URL. | `summary.tsx` | The URL comes from our own API, so the risk is low; cheap to assert `https:`. |
| L6 | Unused `public/next.svg`, `public/vercel.svg`. | no references | Leave; harmless. |
| L7 | `actions/*.tsx` contain no JSX. | | Leave; renaming churns history for no behaviour change. |

### Security review summary

- **Secrets:** none in the repo. `.env` and `.vercel` are git-ignored (verified: `git status` does not list them). All env vars are `NEXT_PUBLIC_*` and public by design (API base URL, billboard id, site URL).
- **Client-trusted prices:** none. Checkout sends only `productIds`; the admin prices from its DB in integer minor units (verified).
- **Authorization:** not applicable (no accounts). The `orderId` on `/order-success` only labels a local record; it grants nothing.
- **Open redirect:** the only redirect target is the URL returned by our own API (L5).
- **Injection:** no HTML injection points (React escapes); query params are passed to the admin, which validates them with zod (verified).
- **Logging:** nothing sensitive is logged in the storefront.
- **Dependencies:** production clean; dev-only vitest advisories (M9).

---

## 7. Proposed implementation sequence

Each step is small, independently testable, and keeps every existing file and uncommitted change intact.

1. **Commit nothing yet; keep all work in the working tree** (you asked for explicit approval before any commit/push).
2. **Fix H3** — add `public/placeholder.svg`.
3. **Fix H2 + M3 + L5 + M10** — checkout in-flight guard, server-message surfacing, https assert; `lib/cart.ts` + `lib/checkout.ts` pure helpers with tests.
4. **Fix M1 + M5** — `lib/api.ts` `fetchJson` (timeout, clear env error), used by all `actions/*`; existing `get-products` tests must keep passing.
5. **Fix M2 + M4** — parallel fetching, category-first 404, exclude the current product from related.
6. **Fix M7** — `aria-label` on icon buttons, keyboard-operable product card.
7. **Fix M8** — `hooks/use-hydrated.ts`; remove the ESLint rule override; lint must be 0 warnings.
8. **M9** — upgrade vitest to 5.x (dev only); revert if anything breaks.
9. **M6 + docs** — `.env.example`, README rewrite, `docs/DEPLOYMENT_WORKFLOW.md`, `docs/GIT_WORKFLOW_AND_ATTRIBUTION.md`, PR template.
10. **Final review** — full diff review, lint/typecheck/test/build, `docs/ENGINEERING_REVIEW.md`.

Not in scope (needs your decision or lives outside this repo): branch protection, Vercel environment variables, GitHub homepage field, mobile search, per-line quantities.

---

## 8. Git and attribution facts (verified)

| Question | Answer |
|---|---|
| Remote | `origin = https://github.com/Shrasingh/QuickCart.git`, public, owner `Shrasingh`, default `main`, unprotected |
| Local branches | `main` (== `origin/main`, 0 ahead / 0 behind), `backup-before-removing-claude` (local only) |
| Authors on `origin/main` (9 commits) | Shraddha Singh `<shra192002@gmail.com>` ×7 (GitHub login `Shrasingh`), Shivang Tripathi `<shivangtripathi101@gmail.com>` ×2 (GitHub login `shivang-tripati`, the 2024-05/06 scaffold commits) |
| GitHub contributors list | `Shrasingh` 7, `shivang-tripati` 2 — matches |
| `shraddhasingh-cfc` on the remote? | **No.** It appears only in the local branch `backup-before-removing-claude` (commit `81cb028`). |
| Claude co-author trailers on the remote? | **No.** Only in the 3 commits on `backup-before-removing-claude`. |
| Was published history ever rewritten? | **Yes, once, on 2026-10-24.** The reflog shows a rebase + amends; GitHub deployments show `65dc245` (old, with trailer) was deployed at 08:58Z and `bd43877` (rewritten) at 09:20Z, so the old commits were briefly on `origin/main` and then force-pushed over. The old SHAs are no longer on any remote branch. (GitHub may still serve them by direct SHA URL until garbage-collected; they are not listed anywhere.) |
| Local repo identity | `user.name=Shraddha Singh`, `user.email=shra192002@gmail.com` (correct) |
| **Global** identity | `user.name=shraddhasingh-cfc`, `user.email=<work email>` (work account) — **any fresh clone without a local override will author commits as the work account.** |
| Shivang's role | Author of the two initial commits (2024). Collaborator status cannot be read without authentication; no commits since 2024-06-06. |
| Uncommitted work | 8 modified + 4 untracked paths from a previous session (tests, CI, `lib/filters.ts`, README, package.json scripts/vitest). Not yet attributed to anyone. |

Recommendations and the "how a fresh clone goes wrong" explanation are in `docs/GIT_WORKFLOW_AND_ATTRIBUTION.md`.

---

## 9. Items requiring your decision

1. **Approve committing the working-tree changes** (the previous session's and this session's) as a series of focused commits authored as `Shraddha Singh <shra192002@gmail.com>`. Nothing is committed or pushed without your go-ahead.
2. **Delete the local `backup-before-removing-claude` branch?** It is the only place the `shraddhasingh-cfc` / Claude-trailer commits still exist. `main` already contains the same code. Safe to delete once you confirm; never push it.
3. **Branch protection on `main`** (require the CI status check and a PR) — needs you in GitHub → Settings → Branches. Exact steps are in `docs/DEPLOYMENT_WORKFLOW.md`.
4. **Vercel Preview environment variables** — should PR previews point at a separate staging store (recommended) or the same production store? Previews that share the production `NEXT_PUBLIC_API_URL` will create real (unpaid, test-mode) orders in the production admin DB.
5. **GitHub homepage field** → change to `https://quick-cart-eta-ecru.vercel.app`.
6. **Global git identity** — keep the work account globally and rely on per-repo overrides, or switch to a conditional include keyed on directory? (Both are documented; global config is not changed by this work.)
7. **Vitest 5 upgrade** — dev-only; attempted and reverted if tests fail. Say no if you'd rather pin 3.x.
