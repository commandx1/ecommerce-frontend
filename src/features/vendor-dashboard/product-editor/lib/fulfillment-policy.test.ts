import { describe, expect, it } from "vitest"
import {
  FULFILLMENT_POLICY_DAYS,
  getFulfillmentPolicyDayUnit,
  getFulfillmentPolicyValue,
  normalizeFulfillmentPolicy,
  parseFulfillmentPolicyDays,
} from "./fulfillment-policy"

describe("parseFulfillmentPolicyDays", () => {
  it.each([
    ["Ships within 1 day", 1],
    ["Ships within 5 business days", 5],
    ["3", 3],
    ["Ships within 6 days", null],
    ["Ships within 12 days", null],
    ["", null],
    [undefined, null],
  ])("%s -> %s", (value, days) => {
    expect(parseFulfillmentPolicyDays(value)).toBe(days)
  })
})

describe("getFulfillmentPolicyDayUnit", () => {
  it.each([
    [1, "day"],
    [2, "days"],
    // Nothing picked yet still reads as plural.
    [null, "days"],
  ])("%s -> %s", (days, unit) => {
    expect(getFulfillmentPolicyDayUnit(days)).toBe(unit)
  })
})

describe("getFulfillmentPolicyValue", () => {
  it("builds the dropdown value for every allowed day count", () => {
    expect(FULFILLMENT_POLICY_DAYS.map(getFulfillmentPolicyValue)).toEqual([
      "Ships within 1 day",
      "Ships within 2 days",
      "Ships within 3 days",
      "Ships within 4 days",
      "Ships within 5 days",
    ])
  })
})

describe("normalizeFulfillmentPolicy", () => {
  it.each([
    ["Ships within 5 business days", "Ships within 5 days"],
    ["Ships within 1 day", "Ships within 1 day"],
    ["within 9 days", ""],
    [undefined, ""],
  ])("%s -> %s", (value, normalized) => {
    expect(normalizeFulfillmentPolicy(value)).toBe(normalized)
  })
})
