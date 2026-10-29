# Changelog

All notable changes to the storefront. Dates are merge dates on `main`.

## Unreleased — `fix/audit-remediation`

Follow-up to the 2026-10-29 cross-repository review (QuickCart + EcommerceCloud).

### Fixed
- `/products?q=a&q=b` (any repeated query key) crashed the catalog page: `searchParams` values can be `string[]`; they are now normalised by `lib/search-params.ts`, and non-numeric price filters are dropped instead of forwarded.
- Catalog responses are shape-checked before components read them; a non-array body from the admin no longer takes down every route through the navbar.
- A product or category page during an admin outage rendered "Page not found"; it now renders a retryable error page (`app/error.tsx`, `app/global-error.tsx`) and 404s only when the admin says the record does not exist.
- Revisiting `/order-success?orderId=…` (reload, Back, bookmark) cleared the cart again; the page now acts once per order id (`useOrders.addOrder` reports whether the id is new).
- Prices were absent from server-rendered HTML and an unparseable value rendered "$NaN".

### Changed
- `package.json` declares `engines.node >= 22` (`query-string@10` requires it); README prerequisites updated.
- Tailwind content globs include `providers/` and `hooks/`.
- Removed unused scaffold assets `public/next.svg`, `public/vercel.svg`.
- `docs/GIT_WORKFLOW_AND_ATTRIBUTION.md` no longer carries the executed commit plan; dated engineering docs carry a status banner.
- `.github/rulesets/main.json`: importable branch ruleset (PR + required CI check, no force-push or deletion) for the repository owner to apply.

### Tests
- 54 → 91 Vitest tests: query-parameter normalisation, shape guards, `apiGetOne` (404 vs outage), guest order store, search-term encoding.

## 2026-10-28 — PR #1, PR #2 (`chore/quickcart-production-hardening`)
- Shared API client with timeout and diagnostics; checkout double-submit guard, https-only redirect guard, exact cart arithmetic; order-id guard on `/order-success`; security headers and report-only CSP; CI workflow; accessibility fixes; README and deployment docs.

## 2026-10-24
- Upgrade to Next.js 16 and React 19; configurable home billboard; checkout error messages; new navbar.

## 2026-07-04
- Search, price filter, guest orders, order-received page, 404 page, skeleton loading.

## 2024-06
- Initial storefront: catalog, categories, cart, Stripe checkout hand-off.
