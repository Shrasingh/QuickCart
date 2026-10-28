// Pure cart arithmetic, kept out of the components so it can be unit-tested.
//
// Prices arrive from the API as decimal strings (e.g. "19.99"). Summing them as
// floating-point numbers produces artefacts such as 0.1 + 0.2 = 0.30000000000000004,
// and even `Math.round(1.005 * 100)` is 100, not 101, because 1.005 * 100 is
// 100.49999999999999 in binary floating point. So we never multiply: the
// decimal text is split into whole and fractional digits and converted exactly.
//
// The total shown in the cart is display-only (the admin re-prices every item
// server-side at checkout), but it should still be exact.

const DECIMAL = /^(\d+)(?:\.(\d*))?$/;

/** Converts a decimal price ("19.99", 19.99) to integer cents. Invalid input counts as 0. */
export function toCents(price: string | number | null | undefined): number {
  if (price === null || price === undefined) return 0;
  const text = typeof price === "number" ? String(price) : price.trim();
  const match = DECIMAL.exec(text);
  if (!match) return 0; // negative, exponent notation, or not a number

  const whole = Number(match[1]);
  // Keep three fractional digits so a half-cent ("1.005") rounds up, not down.
  const fraction = (match[2] ?? "").padEnd(3, "0").slice(0, 3);
  const thousandths = Number(fraction);
  return whole * 100 + Math.floor(thousandths / 10) + (thousandths % 10 >= 5 ? 1 : 0);
}

/** Sum of item prices in major units (dollars), computed exactly in cents. */
export function cartTotal(items: ReadonlyArray<{ price: string | number }>): number {
  const cents = items.reduce((sum, item) => sum + toCents(item.price), 0);
  return cents / 100;
}
