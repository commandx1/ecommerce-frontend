import { describe, expect, it } from "vitest"
import type { SavedCard } from "@/lib/api/orders"
import { isCardExpired, pickInitialCardId } from "./saved-card-utils"

const card = (overrides: Partial<SavedCard> = {}): SavedCard => ({
  id: "c1",
  name: "Clinic Card",
  stripeCardId: "pm_1",
  brand: "visa",
  last4: "4242",
  expMonth: 9,
  expYear: 2030,
  createdDate: "2026-01-01T00:00:00Z",
  ...overrides,
})

describe("isCardExpired", () => {
  it("is still valid on the last day of the expiry month", () => {
    expect(isCardExpired(card({ expMonth: 9, expYear: 2030 }), new Date(2030, 8, 30))).toBe(false)
  })

  it("becomes expired on the first of the following month", () => {
    expect(isCardExpired(card({ expMonth: 9, expYear: 2030 }), new Date(2030, 9, 1))).toBe(true)
  })

  it("returns false for a null/undefined card", () => {
    expect(isCardExpired(null)).toBe(false)
    expect(isCardExpired(undefined)).toBe(false)
  })

  it.each([
    ["NaN month", { expMonth: Number.NaN, expYear: 2030 }],
    ["NaN year", { expMonth: 9, expYear: Number.NaN }],
    ["string month", { expMonth: "9" as unknown as number, expYear: 2030 }],
    ["month 0", { expMonth: 0, expYear: 2030 }],
    ["month 13", { expMonth: 13, expYear: 2030 }],
  ])("treats %s as not expired instead of locking the buyer out", (_label, overrides) => {
    expect(isCardExpired(card(overrides), new Date(2099, 0, 1))).toBe(false)
  })
})

describe("pickInitialCardId", () => {
  it("picks the default card when it is still valid", () => {
    const cards = [card({ stripeCardId: "pm_a" }), card({ stripeCardId: "pm_b", isDefault: true })]
    expect(pickInitialCardId(cards, new Date(2020, 0, 1))).toBe("pm_b")
  })

  it("falls back to the first card when none is marked default", () => {
    const cards = [card({ stripeCardId: "pm_a" }), card({ stripeCardId: "pm_b" })]
    expect(pickInitialCardId(cards, new Date(2020, 0, 1))).toBe("pm_a")
  })

  it("skips an expired default and picks the next usable card", () => {
    const cards = [
      card({ stripeCardId: "pm_default", isDefault: true, expMonth: 1, expYear: 2020 }),
      card({ stripeCardId: "pm_b" }),
    ]
    expect(pickInitialCardId(cards, new Date(2025, 0, 1))).toBe("pm_b")
  })

  it("returns an empty string when every card is expired", () => {
    const cards = [card({ expMonth: 1, expYear: 2020 })]
    expect(pickInitialCardId(cards, new Date(2025, 0, 1))).toBe("")
  })

  it("returns an empty string for an empty or null-filled list", () => {
    expect(pickInitialCardId([])).toBe("")
    expect(pickInitialCardId([null, undefined])).toBe("")
  })

  it("returns an empty string when given something other than an array", () => {
    expect(pickInitialCardId(null as unknown as SavedCard[])).toBe("")
  })
})
