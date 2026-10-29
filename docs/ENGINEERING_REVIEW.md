# QuickCart — Engineering Review and Handoff

**Date:** 2026-10-28 · **Branch:** `chore/quickcart-production-hardening`, merged into `main` via PRs #1 (`31ca09a`) and #2 (`7c80c2a`) on 2026-10-28 · **Baseline:** `bd43877` on `main` · **Status:** historical record of that pass; the 2026-10-29 remediation (branch `fix/audit-remediation`) is described in the README and the pull request itself.

This report covers everything that changed during the production-readiness pass, why, how it was verified, and what remains. Read it alongside `docs/ENGINEERING_AUDIT.md` (findings, with IDs such as H2/M3 referenced below).

---

## 1. Verification results (actual, run after the last change)

| Check | Before (baseline) | After |
|---|---|---|
| `npm run lint` | pass, 5 warnings | **pass, 0 warnings** (rule override removed) |
| `npm run typecheck` | pass | **pass** |
| `npm test` | 19 tests / 3 files | **41 tests / 6 files, all passing** (Vitest 5.0.5); 48 after the §2.9 follow-up |
| `npm run build` | pass | **pass** (Next 16.4.3, all routes dynamic) |
| `npm audit` | 0 prod / 3 dev (2 critical) | **0 vulnerabilities** (prod and dev) |
| Production smoke test (`next start`, admin API **unreachable**) | not run | `/`, `/products`, `/products?q=…`, `/cart`, `/orders`, `/placeholder.svg` → 200 with the expected content; unknown category/product render the 404 page; each failed request logs one `[api] request failed (…)` line |

The smoke test deliberately ran without an admin to prove the storefront degrades to empty states instead of crashing. End-to-end checkout was **not** exercised (no admin/Stripe in this environment); see §5.

---

## 2. Changes made

Each item lists: what existed, the problem, the change, how it is tested, and trade-offs.

### 2.1 Checkout hardening — `app/(routes)/cart/components/summary.tsx`, `lib/checkout.ts`, `lib/cart.ts` (H2, M3, M10, L5)

- **Before:** `onCheckout` had no in-flight state; the button stayed enabled until the browser navigated. The `catch` showed one generic toast. The total was a floating-point sum. The redirect URL was used unchecked.
- **Problem:** every extra click created another unpaid `Order` and Stripe session in the admin database (verified in the admin's checkout route). The admin's deliberate customer-facing 4xx messages ("Some items in your cart are no longer available…") were hidden.
- **Change:** `isSubmitting` state disables the button and relabels it "Redirecting to payment…"; a 15 s axios timeout; `getCheckoutErrorMessage` surfaces 4xx text (truncated to 200 chars), maps 503 to "temporarily unavailable", and hides 5xx/network details; `isSafeCheckoutUrl` accepts only absolute `https:` URLs; `cartTotal` computes the display total exactly in cents. Cancel toast reworded (it previously said "Something went wrong" for a user-initiated cancel).
- **Tests:** `tests/checkout.test.ts` (8), `tests/cart.test.ts` (6). One of the new cart tests caught a real bug in the first draft of `toCents` (`Math.round(1.005 * 100)` is 100); the final version parses the decimal text instead of multiplying.
- **Trade-off:** the button stays disabled after a successful response because the page is navigating away; if the browser blocks the navigation the user must reload. Acceptable versus duplicate orders.

### 2.2 Shared API client — `lib/api.ts`, all eight `actions/get-*.tsx` (M1, M5)

- **Before:** eight copies of the same `fetch`/`try`/`catch`, no timeout, base URL computed at module load, and a missing `NEXT_PUBLIC_API_URL` produced requests to `undefined/products` that were silently swallowed.
- **Change:** `getApiBaseUrl()` (read per call, trailing slash stripped, one clear `console.error` with the fix when unset), `fetchJson()` (10 s `AbortSignal.timeout`, fallback on non-2xx / throw / bad JSON, one `console.warn` line per failure), `apiGet()`. Actions became one-liners; path ids are `encodeURIComponent`-ed.
- **Tests:** `tests/api.test.ts` (7); the pre-existing `tests/get-products.test.ts` (4) passes unchanged, which confirms the query-string contract did not move.
- **Trade-off:** a 10 s ceiling per request means a very slow admin now yields empty sections rather than a late page. That is the intended behaviour on Vercel, whose function timeout would otherwise kill the render.

### 2.3 Page data fetching — `category/[categoryId]/page.tsx`, `products/page.tsx`, `product/[productId]/page.tsx` (M2, M4)

- **Before:** four sequential `await`s on the category page, three on `/products`. "Related Products" included the product being viewed.
- **Change:** independent requests run with `Promise.all`; the 404 check still happens before render. The related list filters out the current `product.id`. `searchParams` typed as optional (they are). Component renamed `CattegoryPage` → `CategoryPage`.
- **Tests:** build + smoke test (404 bodies render). No unit test — page components are not rendered in the suite.
- **Trade-off:** when a category id is invalid, products/sizes/colors are still fetched once before the 404; negligible.

### 2.4 Missing asset and accessibility — `public/placeholder.svg`, `components/ui/icon-button.tsx`, `product-card.tsx`, `cart-item.tsx`, `modal.tsx`, `mobile-filters.tsx`, `navbar-actions.tsx` (H3, M7)

- **Before:** `/placeholder.svg` referenced in two places but absent (404 for image-less products). Icon-only buttons had no accessible name; the product card was a `div onClick` that keyboard users could not activate; the hover-only action overlay never appeared for keyboard focus.
- **Change:** added the SVG. `IconButton` now requires a `label` (rendered as `aria-label` + `title`), sets `type="button"` (prevents accidental form submits) and supports `disabled`. Product card: `role="link"`, `tabIndex=0`, Enter/Space opens the product, focus ring, overlay shown on `focus-within`; add-to-cart button disabled when out of stock. Cart remove, modal close, filter-drawer close and the navbar cart button are labelled; cart image gets `sizes`.
- **Tests:** typecheck enforces the new required `label` prop at every call site; smoke test confirms `aria-label`s are in the SSR output.

### 2.5 Hydration hook — `hooks/use-hydrated.ts`, `currency.tsx`, `navbar-actions.tsx`, `cart/page.tsx`, `orders/page.tsx`, `providers/modal-provider.tsx`, `eslint.config.mjs` (M8)

- **Before:** five copies of `useState(false)` + `useEffect(() => setIsMounted(true))`, each triggering `react-hooks/set-state-in-effect`; the ESLint config downgraded the rule to a warning to live with it.
- **Change:** one `useHydrated()` built on `useSyncExternalStore` (server snapshot `false`, client snapshot `true`) — the React-documented way to express "are we past hydration" without an effect. The rule override is gone and lint is clean.
- **Tests:** lint (0 warnings), build, smoke test (cart/orders SSR still render nothing until hydration, exactly as before).

### 2.6 Tooling — `package.json`, `package-lock.json`, `vitest.config.mts`, `tests/get-products.test.ts` (M9)

- Vitest upgraded 3.2.7 → 5.0.5 (dev-only) to clear the `tinypool` / `@vitest/mocker` advisories; all suites pass without changes. Config renamed `.ts` → `.mts` to silence Vite's "ESM in CommonJS package" warning. The products test now silences the client's expected warning logs.

### 2.7 Documentation — `README.md`, `.env.example`, `docs/*`, `.github/pull_request_template.md` (M6, L2, Priorities 5–7)

- README rewritten to the required structure with only verified claims (live URL checked, test counts, commands, limitations). The broken relative `../EcommerceCloud` link is now the GitHub URL. A one-line AI-assistance disclosure was added to "Project origin" — edit the wording if you like, but keep it truthful.
- `.env.example` documents `NEXT_PUBLIC_SITE_URL`, which the layout already read.
- New: `docs/ENGINEERING_AUDIT.md`, `docs/DEPLOYMENT_WORKFLOW.md`, `docs/GIT_WORKFLOW_AND_ATTRIBUTION.md`, this file, and a PR template.
- Work emails are not written anywhere; the attribution docs refer to the work account by its public GitHub handle only.

### 2.8 Inherited from the previous session (reviewed, kept, now validated)

`lib/filters.ts` + `tests/filters.test.ts`, `tests/use-cart.test.ts`, `tests/setup.ts`, `.github/workflows/ci.yml`, the `filter.tsx` / `price-filter.tsx` / `search-bar.tsx` refactors onto `lib/filters.ts`, the "Order received / Processing" wording, and the `typecheck`/`test` scripts. All reviewed line by line; no changes needed beyond the Vitest upgrade.

### 2.9 Follow-up after the pre-commit review — `lib/checkout.ts`, `summary.tsx`, `tests/checkout.test.ts`, `ci.yml`, `tests/setup.ts`

The read-only review of the committed change set raised three findings; they are addressed in a separate follow-up commit on the same branch.

- **Checkout button stuck after Back from Stripe.** `isSubmitting` is set before the browser navigates to Stripe. If the shopper presses Back, the browser may restore the cart page from its back-forward cache with that React state intact, leaving the button disabled. `onBackForwardRestore` in `lib/checkout.ts` registers a `pageshow` listener and invokes the callback only when `event.persisted` is true; `Summary` uses it in an effect whose cleanup removes the listener. Unit tests cover the wiring (registration, the `persisted` check, cleanup, SSR no-op) against a stubbed `window`. Whether a given browser actually serves the cart page from its back-forward cache after Stripe is **not** established by these tests; it needs a manual check on the preview deployment.
- **HTML error pages in the checkout toast.** `getCheckoutErrorMessage` now surfaces a 4xx body only when the response declares `Content-Type: text/plain` (the admin's deliberate error messages) and the text does not start with `<`. A framework 404 page returned for a misconfigured API URL therefore falls back to the generic message. Tests added for text/plain 4xx, HTML 4xx, HTML mislabelled as text/plain, a 4xx string with no content type, JSON bodies, 5xx (plain and HTML), 503, and network errors.
- **This document** was corrected regarding line endings (see §3).
- Low-risk hardening in the same commit: `permissions: contents: read` at the workflow level of `ci.yml`, and the `tests/setup.ts` comment now says the API URL is read per call rather than at module load.

---

## 3. Files affected

**Modified (30 tracked):** `.env.example`, `README.md`, `actions/*.tsx` (8), `app/(routes)/cart/{cart-item,page}.tsx`, `app/(routes)/cart/components/summary.tsx`, `app/(routes)/category/[categoryId]/page.tsx`, `…/components/{filter,mobile-filters}.tsx`, `app/(routes)/order-success/order-success-content.tsx`, `app/(routes)/orders/page.tsx`, `app/(routes)/product/[productId]/page.tsx`, `app/(routes)/products/page.tsx`, `components/{navbar-actions,price-filter,search-bar}.tsx`, `components/ui/{currency,icon-button,modal,product-card}.tsx`, `eslint.config.mjs`, `package.json`, `package-lock.json`, `providers/modal-provider.tsx`.

**New (untracked):** `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `docs/` (4 files), `hooks/use-hydrated.ts`, `lib/{api,cart,checkout,filters}.ts`, `public/placeholder.svg`, `tests/` (6 suites + setup), `vitest.config.mts`.

**Unrelated changes:** none. `.env`, `.vercel`, `.next` and `tsconfig.tsbuildinfo` remain ignored and untouched. A grep of every changed file for key patterns (`sk_`, `pk_`, `whsec_`, tokens) found nothing.

**Line endings.** The repository has no `.gitattributes`, and this machine has `core.autocrlf=true`. Before this work, some files were stored in git with CRLF endings and the rest with LF. Sixteen of the CRLF-stored files were touched by this change set, and those sixteen were normalized to LF in the index (via a targeted `git add --renormalize` on exactly those paths) so that `git diff --check` no longer reports the carriage returns as trailing whitespace. Files that were not touched were left as they are, so the repository still contains a mix of CRLF and LF files. Consequences for reviewers:

- The sixteen normalized files show as whole-file diffs. The functional changes in them are small; read them with `git diff --ignore-cr-at-eol` (or `-w`), or enable "Hide whitespace changes" on GitHub.
- Four pre-existing trailing-space lines in `mobile-filters.tsx` and `modal.tsx` were stripped at the same time, because they became "added" lines once those files were re-added as LF.
- Recommended follow-up, as its own commit after this PR merges: add a `.gitattributes` with `* text=auto` and run `git add --renormalize .` so every file is stored as LF and this does not recur.

---

## 4. Known limitations (after this pass)

- **404 pages respond with HTTP 200.** Because `app/(routes)/loading.tsx` creates a streaming boundary, the shell is flushed before `notFound()` runs, so unknown categories/products render the 404 UI with a 200 status. Pre-existing (inferred: since `loading.tsx` was added in `b59b9c3`); matters for SEO, not users. Fix options: drop the route-level loading boundary, or check existence in `generateMetadata`. Not changed here — it is a product decision between skeletons and status codes.
- **Single unit per product; no live order status; desktop-only search; USD only** — unchanged, documented in the README.
- **No component or end-to-end tests.** The suite covers logic only.
- **Preview deployments share the admin's single `FRONTEND_STORE_URL`**, so a checkout started on a preview returns to production's `/order-success`.

---

## 5. Remaining risks

| Risk | Severity | Mitigation / owner |
|---|---|---|
| CI has never run on GitHub; branch protection is off; every push to `main` still deploys to production | High | Push the branch, open the PR, then enable protection (steps in `docs/DEPLOYMENT_WORKFLOW.md`). Owner: you |
| Checkout and Stripe redirect not exercised in this environment | Medium | Verify on the Vercel preview with a test card before merging. The changed code paths are unit-tested, and the request/response contract is unchanged |
| Vercel Preview may inherit the production `NEXT_PUBLIC_API_URL` | Medium | Set a Preview-scoped value (staging store) or leave it unset. Owner: you |
| Global git identity is the work account | Medium (attribution) | Repo-local identity is correct; apply Option A or B from the attribution doc for future clones. Owner: you |
| Local branch `backup-before-removing-claude` still carries the unwanted author/trailers | Low (local only) | Delete after confirming; never push |

The project is **demonstrable and well-tested at the logic level** and its deployment is live, but it should not be described as "production-ready" until the CI gate and branch protection are active and a checkout has been verified on a preview deployment.

---

## 6. Recommended next steps

1. Review the diff, commit on a branch and open the PR (commands below). This is the first real exercise of the CI workflow.
2. Enable branch protection on `main` requiring the "Lint, typecheck, test, build" check.
3. In Vercel, add the Preview-scoped `NEXT_PUBLIC_API_URL` (staging store) and the Production-scoped `NEXT_PUBLIC_SITE_URL`.
4. Update the GitHub repository "Website" field to `https://quick-cart-eta-ecru.vercel.app`.
5. Walk the checkout flow on the PR preview with Stripe test card `4242 4242 4242 4242`, then merge.
6. Later: Playwright E2E against a seeded admin; decide on the 404-status trade-off; consider a mobile search entry point.

---

## 7. Exact commands

### Review

```bash
cd C:\Users\shraddha\Desktop\TEST\TEST\QuickCart
git status
git diff --stat -- . ":(exclude)package-lock.json"
git diff -- . ":(exclude)package-lock.json"        # full diff of tracked files
git status --porcelain | findstr "^??"             # new files

npm run lint && npm run typecheck && npm test && npm run build
```

### Publish (only after you have reviewed and approved)

The commit-by-commit plan with suggested messages is in `docs/GIT_WORKFLOW_AND_ATTRIBUTION.md` §5. Minimal form:

```bash
git config user.email                              # must be shra192002@gmail.com
git switch -c chore/production-readiness
# ...stage and commit in the groups from the attribution doc, or as one commit:
git add -A
git commit -m "Production-readiness pass: API client, checkout hardening, a11y, tests, CI, docs"
git push -u origin chore/production-readiness
```

Then open the pull request on GitHub, let CI run, review the Vercel preview, and merge. Do **not** push directly to `main`, and do **not** force-push anything.

### Optional clean-up (after approval)

```bash
git branch -D backup-before-removing-claude       # local only; recoverable via reflog for ~90 days
```
