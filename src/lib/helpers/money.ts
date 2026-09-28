/**
 * Rounds a raw arithmetic result to the nearest cent. Chained floating-point multiplication (unit
 * price * quantity, a per-unit shipping fee * quantity, etc.) routinely leaves an IEEE-754 tail
 * (e.g. `299.96999999999997` instead of `299.97`); every money value handed to a consumer that
 * isn't itself a display formatter (Intl.NumberFormat rounds on the way out, but a raw number can
 * still leak elsewhere) should be rounded through this first.
 */
export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
