// Shared server-side client for the EcommerceCloud admin API.
//
// Every data action used to inline the same fetch/try/catch with no timeout and
// no diagnostic when NEXT_PUBLIC_API_URL was missing. This helper centralises:
//   - the base URL (read per call, so tests and tooling can set it late),
//   - a request timeout (a hung admin must not hang every page render),
//   - a single clear log line when the API is unreachable or misconfigured,
//   - a shape check on the JSON, so a response that is not what the page
//     expects (an error object, `null`, an HTML page parsed as JSON) is treated
//     like a failed request instead of crashing the render with `.map`.
//
// List callers always get their fallback value on failure; pages never crash
// because the catalog is unavailable. Single-record callers can tell "does not
// exist" (404) apart from "could not be loaded" and render accordingly.

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

/** Type guard applied to the parsed JSON body. */
export type Guard<T> = (value: unknown) => value is T;

/** Accepts any JSON array. Element shapes are checked by the components' optional chaining. */
export const isArray: Guard<unknown[]> = (value): value is unknown[] => Array.isArray(value);

/** Accepts a JSON object that carries a non-empty string `id` (every catalog record does). */
export const isRecord: Guard<{ id: string }> = (value): value is { id: string } =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  typeof (value as { id?: unknown }).id === "string" &&
  (value as { id: string }).id.length > 0;

export type FetchOutcome<T> =
  | { ok: true; data: T }
  /** The API answered 404: the record does not exist. */
  | { ok: false; reason: "not_found" }
  /** Anything else: network error, timeout, non-2xx, invalid JSON, unexpected shape. */
  | { ok: false; reason: "unavailable" };

/**
 * GETs `url` and classifies the result. Never throws. Logs one line per failure.
 */
export async function fetchOutcome<T>(url: string, guard: Guard<T>): Promise<FetchOutcome<T>> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (!res.ok) {
      console.warn(`[api] ${res.status} from ${url}`);
      return { ok: false, reason: "unavailable" };
    }
    const json: unknown = await res.json();
    if (!guard(json)) {
      console.warn(`[api] unexpected response shape from ${url}`);
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, data: json };
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown error";
    console.warn(`[api] request failed (${reason}): ${url}`);
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * GETs `url` and returns the parsed JSON, or `fallback` on any failure
 * (404, other non-2xx, network error, timeout, invalid JSON, wrong shape).
 * Without a guard any JSON value is accepted.
 */
export async function fetchJson<T>(url: string, fallback: T, guard?: Guard<T>): Promise<T> {
  const outcome = await fetchOutcome<T>(url, guard ?? ((value): value is T => value !== undefined));
  return outcome.ok ? outcome.data : fallback;
}

/** Convenience: resolves `path` against the configured base URL, then fetches with a fallback. */
export async function apiGet<T>(path: string, fallback: T, guard?: Guard<T>): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) return fallback;
  return fetchJson<T>(`${base}${path}`, fallback, guard);
}

/** Thrown by `apiGetOne` when the admin API could not be read; pages let it reach `error.tsx`. */
export class CatalogUnavailableError extends Error {
  constructor(path: string) {
    super(`The catalog could not be loaded (${path})`);
    this.name = "CatalogUnavailableError";
  }
}

/**
 * Fetches one record. Returns `null` only when the API says it does not exist
 * (404), so the page can render its 404. Any other failure throws
 * `CatalogUnavailableError`: an outage must show an error state, not
 * "Page not found". With no base URL configured it also throws, since the
 * page cannot tell whether the record exists.
 */
export async function apiGetOne<T>(path: string, guard: Guard<T>): Promise<T | null> {
  const base = getApiBaseUrl();
  if (!base) throw new CatalogUnavailableError(path);
  const outcome = await fetchOutcome<T>(`${base}${path}`, guard);
  if (outcome.ok) return outcome.data;
  if (outcome.reason === "not_found") return null;
  throw new CatalogUnavailableError(path);
}
