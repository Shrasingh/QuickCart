// Resolves the storefront's own public URL for Open Graph / canonical
// metadata. `NEXT_PUBLIC_SITE_URL` is optional and cosmetic, so a missing or
// malformed value (a bare hostname, a stray quote) must degrade to the local
// default instead of failing the build: `new URL()` throws on bad input and
// `metadataBase` is evaluated while Next.js collects page data.

export const DEFAULT_SITE_URL = "http://localhost:3001";

let warnedInvalidSiteUrl = false;

/**
 * Returns an absolute http(s) URL for `metadataBase`. Invalid or empty input
 * yields the default and, for invalid input, logs a single warning naming the
 * variable (never a secret; the value is public by design).
 */
export function resolveSiteUrl(raw: string | undefined | null): URL {
  const text = raw?.trim();
  if (!text) return new URL(DEFAULT_SITE_URL);

  try {
    const url = new URL(text);
    if (url.protocol === "http:" || url.protocol === "https:") return url;
  } catch {
    // fall through to the warning below
  }

  if (!warnedInvalidSiteUrl) {
    warnedInvalidSiteUrl = true;
    console.warn(
      `[site] NEXT_PUBLIC_SITE_URL is not an absolute http(s) URL; using ${DEFAULT_SITE_URL} for metadata.`
    );
  }
  return new URL(DEFAULT_SITE_URL);
}
