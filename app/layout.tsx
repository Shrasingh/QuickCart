import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import ModelProviders from "@/providers/modal-provider";
import ToastProvider from "@/providers/toast-provider";

const font = Urbanist({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
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
