// Pure URL/query helpers shared by the filter UI, extracted so the logic can
// be unit-tested without a browser. The components keep reading the current
// params and calling the router; these functions only compute values.

export type Query = Record<string, unknown>;

export interface PriceRange {
  label: string;
  min?: number;
  max?: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { label: "Under $50", max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "$100 – $250", min: 100, max: 250 },
  { label: "$250 – $500", min: 250, max: 500 },
  { label: "Over $500", min: 500 },
];

/** A price range is "active" when the URL's min/max already equal it. */
export function isPriceRangeActive(
  currentMin: string | undefined,
  currentMax: string | undefined,
  min?: number,
  max?: number
): boolean {
  return String(min ?? "") === (currentMin ?? "") && String(max ?? "") === (currentMax ?? "");
}

/**
 * Builds the query for clicking a price range: selecting a range sets its
 * bounds; clicking the active range (or a bound that is undefined) clears it.
 * Nulls are dropped by `stringifyUrl({ skipNull: true })`.
 */
export function buildPriceQuery(
  current: Query,
  currentMin: string | undefined,
  currentMax: string | undefined,
  min?: number,
  max?: number
): Query {
  const active = isPriceRangeActive(currentMin, currentMax, min, max);
  return {
    ...current,
    minPrice: active || min === undefined ? null : min,
    maxPrice: active || max === undefined ? null : max,
  };
}

/**
 * Toggles a single-select filter (size, color, …): selecting a value sets it,
 * clicking the already-selected value clears it.
 */
export function toggleFilterValue(current: Query, valueKey: string, id: string): Query {
  const query: Query = { ...current, [valueKey]: id };
  if (current[valueKey] === id) query[valueKey] = null;
  return query;
}

/** Search submit target: `/products?q=…` for a non-empty term, else `/products`. */
export function buildSearchUrl(value: string): string {
  const q = value.trim();
  return q ? `/products?q=${encodeURIComponent(q)}` : "/products";
}
