import { describe, expect, it } from "vitest"
import type { SavedCard } from "@/lib/api/orders"
import { makeApiSavedCard } from "@/test/factories"
import { savedCardNeedsAutoOrderConsent } from "./useCheckoutAutoOrder"

// makeApiSavedCard builds an ApiSavedCard (src/lib/api/payment-methods), which is a
// structurally compatible shape to the SavedCard (src/lib/api/orders) this function
// actually takes — both carry the same `openToAutoPayment?: boolean` field it reads.

describe("savedCardNeedsAutoOrderConsent", () => {
  it("returns false when there is no card at all", () => {
    expect(savedCardNeedsAutoOrderConsent(undefined)).toBe(false)
  })

  it("returns false when the card is already open to auto payment", () => {
    const card = makeApiSavedCard({ openToAutoPayment: true }) as unknown as SavedCard
    expect(savedCardNeedsAutoOrderConsent(card)).toBe(false)
  })

  it("returns true when the card explicitly opts out of auto payment", () => {
    const card = makeApiSavedCard({ openToAutoPayment: false }) as unknown as SavedCard
    expect(savedCardNeedsAutoOrderConsent(card)).toBe(true)
  })

  // Fail-safe default: when the field is entirely absent (not false, just missing),
  // `!undefined` is true, so consent is still required. Locking in this fail-safe
  // behavior explicitly.
  it("returns true (fail-safe) when openToAutoPayment is entirely missing", () => {
    const card = makeApiSavedCard({ openToAutoPayment: undefined }) as unknown as SavedCard
    expect(savedCardNeedsAutoOrderConsent(card)).toBe(true)
  })
})
