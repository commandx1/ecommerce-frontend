import { describe, expect, it } from "vitest"
import { getStatusBadgeColor, getStockColor } from "./status-badge"

describe("getStockColor", () => {
  it.each([
    [0, "text-danger"],
    [19, "text-warning"],
    [20, "text-success"],
    [1000, "text-success"],
  ])("maps stock %i to %s", (stock, expected) => {
    expect(getStockColor(stock)).toBe(expected)
  })
})

describe("getStatusBadgeColor", () => {
  it.each([
    ["Active" as const, "text-success"],
    ["Inactive" as const, "text-warning"],
    ["Archived" as const, "text-text-primary"],
  ])("maps %s to a class containing %s", (status, expectedFragment) => {
    expect(getStatusBadgeColor(status)).toContain(expectedFragment)
  })
})
