# QuickCart — Storefront

A fast, modern **customer-facing ecommerce storefront** built with Next.js 16 (App Router). Browse products by category, filter by size and color, preview products in a modal, manage a persistent cart, and check out with Stripe.

> QuickCart is the **frontend** of a two-app system. It has no database of its own — it reads products, categories, sizes, colors and billboards from the [EcommerceCloud](../EcommerceCloud) admin API, and posts checkouts to it.

## ✨ Features

- 🏠 **Home** — hero billboard + featured products
- 🗂️ **Category pages** — filter products by **size** and **color** (URL-synced, mobile filter drawer)
- 🔍 **Product details** — image gallery, size/color, add to cart
- ⚡ **Quick preview** — preview a product in a modal from the grid
- 🛒 **Cart** — zustand store persisted to `localStorage`, live item count in the navbar
- 💳 **Checkout** — redirects to Stripe Checkout; clears cart on success
- 📱 **Responsive** — mobile-first layout, skeleton loading states, empty & 404 states
- 🔎 **SEO** — Open Graph / Twitter metadata, favicon

## 🧱 Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| UI | @headlessui/react, lucide-react |
| State | zustand (+ persist) |
| Data | server-side `fetch` to the EcommerceCloud API, `query-string` |
| Notifications | react-hot-toast |

## 📁 Project structure

```
app/
  layout.tsx              Fonts, providers, navbar/footer, SEO metadata
  (routes)/
    page.tsx              Home (billboard + featured)
    category/[categoryId] Category listing with filters
    product/[productId]   Product detail + related
    cart/                 Cart + order summary/checkout
  loading.tsx             Skeleton loading state
  not-found.tsx           404 page
actions/                  get-products, get-product, get-categories, get-billboard, ...
components/               navbar, product-card, product-list, billboard, gallery, ui/*
hooks/                    use-cart, use-preview-model (zustand)
type.ts                   Shared API types
```

## 🚀 Getting started

### 1. Prerequisites
- Node.js 18+
- A running **EcommerceCloud** admin with at least one store and some products (see that repo's README, and its seed script for a ready-made demo catalog).

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Set `NEXT_PUBLIC_API_URL` to your admin API base for the store:
```
# local (admin on :3000, storefront on :3001)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/<storeId>
```
The `<storeId>` is printed by the admin's seed script and shown in the admin dashboard under **Settings**.

### 4. Run
```bash
npm run dev -- -p 3001      # http://localhost:3001
```
Run the admin on port 3000 and QuickCart on 3001 so the Stripe redirect URLs line up (`FRONTEND_STORE_URL=http://localhost:3001` in the admin).

## ☁️ Deployment (Vercel)

1. Push to GitHub and import the repo into [Vercel](https://vercel.com).
2. Add `NEXT_PUBLIC_API_URL` (pointing at your **deployed** admin, e.g. `https://your-admin.vercel.app/api/<storeId>`).
3. Optionally set `NEXT_PUBLIC_SITE_URL` to the deployed storefront URL (used for Open Graph metadata).
   Optionally set `NEXT_PUBLIC_HOME_BILLBOARD_ID` to the hero billboard id (printed by the admin seed); otherwise the first billboard is shown.
4. Deploy. Ensure the admin's `FRONTEND_STORE_URL` points back at this storefront's URL.

## 🖼️ Images

`next.config.mjs` allows images from `res.cloudinary.com`, `images.unsplash.com`, `plus.unsplash.com` and `picsum.photos`. Add any other host you use for product/billboard images there.

## 📝 License

Personal portfolio project.
