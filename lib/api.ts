// Shared server-side client for the EcommerceCloud admin API.
//
// Every data action used to inline the same fetch/try/catch with no timeout and
// no diagnostic when NEXT_PUBLIC_API_URL was missing. This helper centralises:
//   - the base URL (read per call, so tests and tooling can set it late),
//   - a request timeout (a hung admin must not hang every page render),
//   - a single clear log line when the API is unreachable or misconfigured.
//
// Callers always get their fallback value on failure; pages never crash
// because the catalog is unavailable.

export const API_TIMEOUT_MS = 10_000;

let warnedMissingBaseUrl = false;

/** Base URL of the admin API for this store, or null if not configured. */
export function getApiBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    if (!warnedMissingBaseUrl) {
      warnedMissingBaseUrl = true;
      console.error(
        "[api] NEXT_PUBLIC_API_URL is not set. The storefront cannot load any catalog data. " +
          "Copy .env.example to .env and point it at your EcommerceCloud store API."
      );
    }
    return null;
  }
  return raw.replace(/\/+$/, "");
}

/**
 * GETs `url` and returns the parsed JSON, or `fallback` on any failure
 * (non-2xx, network error, timeout, invalid JSON).
 */
export async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
    if (!res.ok) {
      console.warn(`[api] ${res.status} from ${url}`);
      return fallback;
    }
    return (await res.json()) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown error";
    console.warn(`[api] request failed (${reason}): ${url}`);
    return fallback;
  }
}

/** Convenience: resolves `path` against the configured base URL, then fetches. */
export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) return fallback;
  return fetchJson<T>(`${base}${path}`, fallback);
}
