// Origin of the admin API, derived at build time so the Content Security
// Policy below can name it in `connect-src` (the cart's checkout POST goes
// straight from the browser to the admin). Empty when the variable is unset
// or malformed; the data client logs that case separately.
function adminApiOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return "";
  }
}

// Hosts that may serve product and billboard images. `remotePatterns` governs
// next/image; the CSP `img-src` must list the same hosts (plus Vercel's image
// optimizer path on our own origin) or optimized images would be blocked.
const imageHosts = [
  "res.cloudinary.com",
  "images.unsplash.com",
  "plus.unsplash.com",
  "picsum.photos",
];

// Report-only on purpose: the policy is visible as console violations on a
// preview deployment without the risk of blocking a legitimate request. The
// next step (switch the header name to `Content-Security-Policy`) is in
// docs/DEPLOYMENT_WORKFLOW.md and should follow a clean walk-through of the
// shopping flow on a preview with the browser console open.
//   - script-src needs 'unsafe-inline' for Next.js hydration bootstrap without
//     a nonce; 'unsafe-eval' is only required by the development bundler.
//   - style-src 'unsafe-inline' covers framer-motion and the billboard's
//     inline background-image style.
//   - Billboard images are CSS backgrounds, so `img-src` also applies to them.
//   - Stripe Checkout is a top-level navigation, not a frame or fetch, so it
//     needs no allowance here.
function contentSecurityPolicy() {
  const api = adminApiOrigin();
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${imageHosts.map((host) => `https://${host}`).join(" ")}`,
    "font-src 'self' data:",
    `connect-src 'self'${api ? ` ${api}` : ""}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy() },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
      port: "",
      pathname: "/**",
    })),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
