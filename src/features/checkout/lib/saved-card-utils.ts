import type { SavedCard } from "@/lib/api/orders"

type ExpiryFields = Pick<SavedCard, "expMonth" | "expYear">

/**
 * A card is valid through the last day of its expiry month, so `now` only counts as expired once
 * it reaches the first of the FOLLOWING month (JS Date's 0-indexed month already gives us that
 * for free: `new Date(year, expMonth, 1)`). Malformed `expMonth`/`expYear` from the backend never
 * lock the buyer out - they're treated as not expired instead.
 */
export function isCardExpired(card: ExpiryFields | null | undefined, now: Date = new Date()): boolean {
  if (!card) return false
  const { expMonth, expYear } = card
  if (!Number.isFinite(expMonth) || !Number.isFinite(expYear)) return false
  if (expMonth < 1 || expMonth > 12) return false

  return now >= new Date(expYear, expMonth, 1)
}

/**
 * Which saved card should be pre-selected when the billing step first loads: the default card,
 * or failing that the first one - skipping expired cards (and null/undefined slots) either way.
 * Empty string means "no usable saved card", which is also what "new card" means in the store.
 */
export function pickInitialCardId(cards: readonly (SavedCard | null | undefined)[], now: Date = new Date()): string {
  if (!Array.isArray(cards)) return ""
  const usable = cards.filter((card): card is SavedCard => card != null && !isCardExpired(card, now))
  const defaultCard = usable.find((card) => card.isDefault === true)
  return (defaultCard ?? usable[0])?.stripeCardId ?? ""
}
