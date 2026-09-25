import type { EditingDraft } from "../types"

// Discount math on the backend leaves float noise behind (32.219249999999995),
// which is unreadable once it lands in an <input>. Seed drafts with a rounded
// value for display...
export const toDecimalInput = (value: number | undefined, fractionDigits = 2): string =>
  String(Number((value ?? 0).toFixed(fractionDigits)))

// ...and send the untouched original back when the user never edited the field,
// so the rounding alone is not seen as a change. That matters because the backend
// rejects updating price and discount together and clears the discount whenever
// the price changes.
export const keepOriginalIfUnchanged = (
  nextValue: number,
  originalValue: number | undefined,
  fractionDigits = 2,
): number => {
  const original = originalValue ?? 0
  return Number(original.toFixed(fractionDigits)) === nextValue ? original : nextValue
}

// `Number.parseInt` truncates "1.5" down to 1 without complaint, so a vendor who types a
// fractional stock count gets it silently rounded away. This parses the whole string and
// only accepts it when it is actually a whole number (or empty, which callers reject too).
export const parseWholeNumber = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  return Number.isInteger(parsed) ? parsed : null
}

// Backend rejects a discount outside 0-100 (`UserProductServiceImpl.update`: "Discount must be
// between 0 and 100"). An empty or unparseable draft is left to the existing required-field
// guard, not flagged here as an out-of-range value.
export const isDiscountOutOfRange = (value: string): boolean => {
  const trimmed = value.trim()
  if (trimmed === "") return false
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && (parsed < 0 || parsed > 100)
}

export interface ParsedEditingDraft {
  price: number
  discount: number
  stock: number
  active: boolean
  shipmentFee: number
  heavyShippingSurcharge: number
}

/** The single "is this draft saveable" check for both the Save button and the save handler; `null` if not. */
export function parseEditingDraft(draft: EditingDraft): ParsedEditingDraft | null {
  const price = Number.parseFloat(draft.price)
  const discount = Number.parseFloat(draft.discount)
  const stock = parseWholeNumber(draft.stock)
  const shipmentFee = Number.parseFloat(draft.shipmentFee)
  const heavyShippingSurcharge = Number.parseFloat(draft.heavyShippingSurcharge)

  if (
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(discount) ||
    discount < 0 ||
    discount > 100 ||
    stock === null ||
    stock < 0 ||
    !Number.isFinite(shipmentFee) ||
    shipmentFee < 0 ||
    !Number.isFinite(heavyShippingSurcharge) ||
    heavyShippingSurcharge < 0
  ) {
    return null
  }

  return { price, discount, stock, active: draft.active === "active", shipmentFee, heavyShippingSurcharge }
}
