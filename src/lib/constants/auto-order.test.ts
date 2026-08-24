import { describe, expect, it } from "vitest"
import {
  AUTO_ORDER_PERIOD_DAYS,
  AUTO_ORDER_PERIOD_LABELS,
  AUTO_ORDER_PERIODS,
  DEFAULT_AUTO_ORDER_PERIOD,
  isAutoOrderPeriod,
} from "./auto-order"

describe("isAutoOrderPeriod", () => {
  it.each(AUTO_ORDER_PERIODS)("returns true for the valid period %s", (period) => {
    expect(isAutoOrderPeriod(period)).toBe(true)
  })

  it("returns false for a typo'd period value", () => {
    expect(isAutoOrderPeriod("TWO_WEEK")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isAutoOrderPeriod(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isAutoOrderPeriod(undefined)).toBe(false)
  })

  it("returns false for the number 0", () => {
    expect(isAutoOrderPeriod(0)).toBe(false)
  })

  it("returns false for a plain object", () => {
    expect(isAutoOrderPeriod({})).toBe(false)
  })

  it("returns false for an empty string", () => {
    expect(isAutoOrderPeriod("")).toBe(false)
  })
})

describe("AUTO_ORDER_PERIOD_DAYS", () => {
  // Documented trap: TWO_WEEKS maps to 15 days, not 14 — this is what the backend
  // scheduler actually uses. Regression test per the source's own doc comment.
  it("maps TWO_WEEKS to 15 days (not 14)", () => {
    expect(AUTO_ORDER_PERIOD_DAYS.TWO_WEEKS).toBe(15)
  })

  it("maps ONE_MONTH to 30 days", () => {
    expect(AUTO_ORDER_PERIOD_DAYS.ONE_MONTH).toBe(30)
  })

  it("maps TWO_MONTHS to 60 days", () => {
    expect(AUTO_ORDER_PERIOD_DAYS.TWO_MONTHS).toBe(60)
  })
})

describe("AUTO_ORDER_PERIOD_LABELS", () => {
  it("labels TWO_WEEKS in terms of days, matching its 15-day cadence", () => {
    expect(AUTO_ORDER_PERIOD_LABELS.TWO_WEEKS).toBe("Every 15 days")
  })

  it("labels ONE_MONTH in terms of days", () => {
    expect(AUTO_ORDER_PERIOD_LABELS.ONE_MONTH).toBe("Every 30 days")
  })

  it("labels TWO_MONTHS in terms of days", () => {
    expect(AUTO_ORDER_PERIOD_LABELS.TWO_MONTHS).toBe("Every 60 days")
  })
})

describe("AUTO_ORDER_PERIODS", () => {
  it("contains exactly the three known periods", () => {
    expect(AUTO_ORDER_PERIODS).toEqual(["TWO_WEEKS", "ONE_MONTH", "TWO_MONTHS"])
  })
})

describe("DEFAULT_AUTO_ORDER_PERIOD", () => {
  it("defaults to ONE_MONTH", () => {
    expect(DEFAULT_AUTO_ORDER_PERIOD).toBe("ONE_MONTH")
  })

  it("is itself a valid auto order period", () => {
    expect(isAutoOrderPeriod(DEFAULT_AUTO_ORDER_PERIOD)).toBe(true)
  })
})
