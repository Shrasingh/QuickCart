# QuickCart — Development, Staging and Production Workflow

This document describes how a change travels from a laptop to the live storefront, what is automated, what is manual, and what still needs to be configured. It is written against the repository's **actual** hosting: GitHub (`Shrasingh/QuickCart`) and Vercel (project `quick-cart`).

Legend: **[Implemented]** exists in this repo · **[Platform]** provided by GitHub/Vercel and verified · **[Manual]** a human does it · **[To configure]** recommended, not yet set up — needs the repository owner.

---

## 1. Environments

QuickCart has **no database and no secrets of its own**. Each environment is defined entirely by *which admin store* it points at (`NEXT_PUBLIC_API_URL`) and *what URL it is served from* (`NEXT_PUBLIC_SITE_URL`). The important separation is therefore on the **admin side**: each storefront environment must talk to a store whose orders you are happy to pollute.

| Environment | Purpose | Where it runs | Points at | Who can break it |
|---|---|---|---|---|
| **Local development** | Build features, run tests | Your machine, `npm run dev -- -p 3001` | A local admin (`http://localhost:3000/api/<storeId>`) or a dedicated dev store on the deployed admin | Only you |
| **Preview (QA / staging)** | Review a pull request on a real URL before merging | Vercel Preview deployment, one per PR/branch **[Platform – Vercel default; verify on the first PR]** | A **staging store** in the admin (see §4) **[To configure]** | Reviewers; nobody else sees it |
| **Production** | The public demo: <https://quick-cart-eta-ecru.vercel.app> | Vercel Production deployment from `main` **[Platform – verified: every push to `main` triggers `vercel[bot]`]** | The production store | Everyone |

What is **not** here: there is no separate "QA server" to maintain. Vercel Preview deployments *are* the staging environment: ephemeral, one per pull request, same build as production, different environment variables.

---

## 2. The path of a change

```
   laptop                     GitHub                          Vercel
┌───────────┐   push    ┌──────────────────┐            ┌──────────────────┐
│ feature   │ ────────▶ │ branch + PR      │ ─────────▶ │ Preview deploy   │  ← reviewers click through
│ branch    │           │                  │            │ (staging env)    │
│ npm test  │           │ CI: lint         │            └──────────────────┘
│ npm run   │           │     typecheck    │
│   lint    │           │     test         │
│   build   │           │     build        │
└───────────┘           │  ✔ required      │  [To configure: branch protection]
                        └────────┬─────────┘
                                 │ merge (squash or merge commit)
                                 ▼
                        ┌──────────────────┐            ┌──────────────────┐
                        │ main             │ ─────────▶ │ Production deploy│
                        └──────────────────┘            └──────────────────┘
```

### Step by step

1. **Branch** from `main`: `git switch -c feat/<short-name>` (or `fix/…`, `chore/…`, `docs/…`). **[Manual]**
2. **Develop** with the local checks: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before opening a PR. **[Implemented – scripts in `package.json`]**
3. **Push and open a pull request** against `main`. The PR template (`.github/pull_request_template.md`) asks what changed, how it was tested, and whether docs/env vars changed. **[Implemented]**
4. **CI runs automatically** (`.github/workflows/ci.yml`): `npm ci` → lint → typecheck → test → production build, on Node 22, with a placeholder `NEXT_PUBLIC_API_URL` so the build never needs a real backend. Concurrency cancels superseded runs. **[Implemented – verified 2026-10-28: ran on both PR #1 commits and on the merge to `main`; the first PR run failed on an `npm ci` lockfile mismatch, fixed in `b53c6ab`]**
5. **Vercel builds a Preview deployment** for the branch and comments the URL on the PR. **[Platform – verified 2026-10-28: Preview deployments were created for both PR #1 commits]**
6. **Review** the diff and the preview URL. For storefront changes, walk the core journey on the preview: home → category → filters → product → add to cart → checkout (Stripe **test** card `4242 4242 4242 4242`) → order-received page. **[Manual]**
7. **Merge** once CI is green and the review is approved. **[Manual; make it enforced via §3]**
8. **Vercel deploys `main` to Production.** If the build fails, the previous production deployment stays live. **[Platform – verified behaviour]**
9. **Smoke-test production**: open the home page, one category, and the cart. **[Manual]**

### Long-lived branches

Only `main`. No `develop`, `staging` or `release` branches: with Preview deployments per PR they would add merge work without adding safety. Feature branches are deleted after merge.

---

## 3. Validation gates

| Gate | Status | What it catches |
|---|---|---|
| ESLint (`next/core-web-vitals`) | **[Implemented]** 0 errors, 0 warnings today | Hook misuse, a11y basics, unused code |
| TypeScript `tsc --noEmit` (strict) | **[Implemented]** | Type regressions, wrong `params`/`searchParams` shapes |
| Vitest (54 tests, node env, no network) | **[Implemented]** | Cart arithmetic, URL/filter logic, API client failure modes, checkout error mapping, redirect guard, order-id guard |
| Security headers (`next.config.mjs`) | **[Implemented]** CSP is report-only | Clickjacking, MIME sniffing, referrer leakage; CSP violations are visible in the browser console on previews |
| `next build` | **[Implemented]** | Server/client component mistakes, broken imports, route config |
| Branch protection on `main` | **[To configure]** | Merging with red CI; pushing directly to production |
| Preview deployment review | **[Platform + Manual]** | Visual/behavioural regressions tests can't see |

### Enabling branch protection (one-time, repository owner)

GitHub → `Shrasingh/QuickCart` → **Settings → Branches → Add branch ruleset** (or classic protection rule) for `main`:

- Require a pull request before merging (0 approvals is acceptable for a solo project; the point is that nothing lands without CI).
- Require status checks to pass → select **"Lint, typecheck, test, build"** (the job name in `ci.yml`). The check appears in the list only after the workflow has run once, so push the workflow first.
- Block force pushes. Block deletions.
- Optionally "Require branches to be up to date before merging".

This cannot be done from the repository itself; it needs your GitHub session. Status on 2026-10-28: the public branches API still reports `protected: false` and no rulesets.

### Promoting the Content Security Policy

`next.config.mjs` sends the policy as `Content-Security-Policy-Report-Only`, so violations are logged in the browser console but nothing is blocked. To enforce it:

1. On a preview deployment, open the browser console and walk home → category → filters → product → quick preview → cart → **Checkout** (stop at the Stripe page) → Back → `/order-success` link from an order.
2. If no `[Report Only]` CSP violations appear, change the header key in `next.config.mjs` to `Content-Security-Policy` in a PR and repeat the walk on that PR's preview.
3. Ignore violations whose source is `vercel.live` on Preview deployments: that is the Vercel toolbar, which is not injected into Production. If a violation appears for an image host, add it to `imageHosts`; for anything else, fix the source rather than widening the policy. The admin origin in `connect-src` comes from `NEXT_PUBLIC_API_URL` at build time, so each Vercel environment gets its own value.

---

## 4. Environment variables and data separation

### Variables

| Variable | Required | Local | Preview | Production | Notes |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:3000/api/<devStoreId>` | `https://<admin>/api/<stagingStoreId>` | `https://<admin>/api/<prodStoreId>` | Selects the store. Public by design (the browser calls `/checkout` on it). |
| `NEXT_PUBLIC_SITE_URL` | no | `http://localhost:3001` | leave unset (Vercel preview URLs change) | `https://quick-cart-eta-ecru.vercel.app` | Open Graph `metadataBase`. Must include the scheme; a malformed value is ignored with a warning rather than failing the build. |
| `NEXT_PUBLIC_HOME_BILLBOARD_ID` | no | per store | per store | per store | Hero billboard; falls back to the store's first billboard. |

Set these in **Vercel → Project → Settings → Environment Variables**, choosing the **Preview** and **Production** scopes separately. **[Manual / To configure for Preview]**. None are secrets; there are no server-only secrets in this app. The GitHub Actions workflow needs **no secrets at all**.

### Why Preview must not inherit Production's `NEXT_PUBLIC_API_URL`

The storefront's only write is `POST /checkout`, which **creates an `Order` row in the admin database** for the store in `NEXT_PUBLIC_API_URL` and then opens Stripe. A preview deployment pointed at the production store would therefore insert test orders into the production store's order list and dashboard every time a reviewer tries checkout. Vercel applies Production variables to Preview deployments **only if you set them with "All environments"**, so when adding `NEXT_PUBLIC_API_URL` select the scopes explicitly.

Recommended setup (requires the admin, not this repo):

1. In EcommerceCloud, create a second store (e.g. "QuickCart Staging") under the same account, or run the seed script against a separate database. Note its `storeId`.
2. In Vercel, set `NEXT_PUBLIC_API_URL` for the **Preview** scope to `https://<admin>/api/<stagingStoreId>`.
3. The admin's `FRONTEND_STORE_URL` is a single value used for Stripe redirect URLs, so **checkout from a preview will redirect back to the production storefront's `/order-success`**, not the preview. This is a limitation of the current admin (one storefront URL per deployment). Options: accept it for previews (payment still works, the order-received page just opens on production), or deploy a separate staging admin with `FRONTEND_STORE_URL` pointing at a fixed preview alias. **[Not configured; documented]**

Until a staging store exists, the safe interim is to **not** set `NEXT_PUBLIC_API_URL` for Preview at all: previews will then render an empty catalog (the app degrades gracefully) and checkout cannot create orders. That still validates build, layout and navigation.

### Stripe

Keys live only in the admin. Production and the demo use Stripe **test** mode; no real money moves. Never put a Stripe key in this repository or in a `NEXT_PUBLIC_*` variable.

---

## 5. Rollback and failed deployments

| Situation | What happens | What to do |
|---|---|---|
| CI fails on a PR | PR can't merge once protection is on; nothing deploys | Fix on the branch and push again |
| `next build` fails on Vercel for `main` | Vercel marks the deployment **Error**; the previous production deployment stays live **[Platform – verified behaviour]** | Fix forward with a PR. Because CI runs the same `next build`, this should be rare |
| A bad change reaches production (builds fine, behaves wrong) | Live site is broken | **Fastest:** Vercel → Deployments → previous good deployment → **"Promote to Production"** / **Instant Rollback** (seconds, no git change). **Then** fix forward: `git revert <sha>` on a branch → PR → merge, so `main` matches what is live |
| The admin API is down or slow | Pages render with empty catalog after a 10 s timeout per request (`lib/api.ts`); checkout shows an error toast | Nothing to roll back in the storefront; fix the admin |
| Admin API contract changes (e.g. field renamed) | Storefront still builds (types are declared locally in `type.ts`) but renders missing data | Coordinate deploys: the admin keeps old fields until the storefront is updated, or deploy both from matching commits |

Never `git push --force` to `main` as a rollback mechanism; it rewrites published history and can orphan the deployment Vercel has already built.

---

## 6. Summary: implemented vs. remaining

**Implemented in this repository**

- CI workflow with lint, typecheck, 54 tests and a production build, requiring no secrets.
- Baseline security headers and a report-only CSP.
- PR template.
- Graceful degradation when the API is unreachable (timeouts, fallbacks, one clear log line on misconfiguration).
- `.env.example` documenting every variable with safe values.

**Verified on the platforms**

- Vercel is connected to the GitHub repo and deploys `main` to production automatically.
- The production storefront is live and serves the seeded catalog.

**Needs the repository owner (cannot be done from the repo)**

1. ~~Push the workflow and open the first PR, so the CI check exists.~~ Done: PR #1 merged 2026-10-28 with the check green.
2. Enable branch protection on `main` requiring that check (still off as of 2026-10-28).
3. Add a Preview-scoped `NEXT_PUBLIC_API_URL` pointing at a staging store (or leave it unset).
4. Set `NEXT_PUBLIC_SITE_URL` in the Production scope.
5. Update the GitHub repository "Website" field from the stale `quickcart-six.vercel.app` to `https://quick-cart-eta-ecru.vercel.app`.
