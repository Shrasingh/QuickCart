import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import ModelProviders from "@/providers/modal-provider";
import ToastProvider from "@/providers/toast-provider";
import { resolveSiteUrl } from "@/lib/site-url";

const font = Urbanist({ subsets: ["latin"] });

// The Navbar fetches categories from the admin API; render on every request so
// pages like /cart don't freeze the categories that existed at build time.
export const revalidate = 0;

// Optional and cosmetic: a bad value must not break the build (see lib/site-url.ts).
const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "QuickCart — Modern Online Store",
    template: "%s | QuickCart",
  },
  description:
    "QuickCart is a fast, modern ecommerce storefront. Browse electronics, fashion, home, books and more with a clean shopping experience.",
  keywords: [
    "ecommerce",
    "online store",
    "shopping",
    "electronics",
    "fashion",
    "QuickCart",
  ],
  openGraph: {
    title: "QuickCart — Modern Online Store",
    description:
      "Browse electronics, fashion, home, books and more with a clean, fast shopping experience.",
    url: siteUrl.href,
    siteName: "QuickCart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickCart — Modern Online Store",
    description:
      "Browse electronics, fashion, home, books and more with a clean, fast shopping experience.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>
        <ModelProviders />
        <ToastProvider/>
        <Navbar/>
        {children}
        <Footer />
        </body>
    </html>
  );
}
