// Next.js hands repeated query keys (`?q=a&q=b`) to a page as `string[]`,
// while a single key is a `string`. Pages used to type every param as a
// string and call `.trim()` on it, which threw on the array form and crashed
// the request. These helpers accept whatever the URL delivers.

export type RawParam = string | string[] | undefined;

/** First value of a possibly repeated query parameter, trimmed; undefined when blank or absent. */
export function firstParam(value: RawParam): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const text = typeof raw === "string" ? raw.trim() : "";
  return text ? text : undefined;
}

/**
 * A price filter from the URL: a finite, non-negative number as a string, or
 * undefined. Anything else (`abc`, `-1`, `1e999`) is dropped instead of being
 * forwarded to the admin, which would answer 400 and empty the whole listing.
 */
export function priceParam(value: RawParam): string | undefined {
  const text = firstParam(value);
  if (text === undefined) return undefined;
  if (!/^\d+(\.\d+)?$/.test(text)) return undefined;
  return Number.isFinite(Number(text)) ? text : undefined;
}
