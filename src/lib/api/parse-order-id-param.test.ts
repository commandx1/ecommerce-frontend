import { describe, expect, it } from "vitest"
import { parseOrderIdParam } from "./orders"

describe("parseOrderIdParam", () => {
  it("returns null for null", () => {
    expect(parseOrderIdParam(null)).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(parseOrderIdParam("")).toBeNull()
  })

  it("returns a valid lowercase UUID unchanged", () => {
    expect(parseOrderIdParam("11111111-1111-1111-1111-111111111111")).toBe("11111111-1111-1111-1111-111111111111")
  })

  it("lowercases a valid UPPERCASE UUID", () => {
    expect(parseOrderIdParam("11111111-1111-1111-1111-111111111111".toUpperCase())).toBe(
      "11111111-1111-1111-1111-111111111111",
    )
  })

  it("lowercases a valid mixed-case UUID", () => {
    expect(parseOrderIdParam("1A2b3C4d-1111-1111-1111-111111111111")).toBe("1a2b3c4d-1111-1111-1111-111111111111")
  })

  it("rejects a value with a leading or trailing space", () => {
    expect(parseOrderIdParam(" 11111111-1111-1111-1111-111111111111")).toBeNull()
    expect(parseOrderIdParam("11111111-1111-1111-1111-111111111111 ")).toBeNull()
  })

  it("rejects a value with a trailing newline", () => {
    expect(parseOrderIdParam("11111111-1111-1111-1111-111111111111\n")).toBeNull()
  })

  it.each([
    ["35 chars (one short)", "11111111-1111-1111-1111-11111111111"],
    ["37 chars (one long)", "11111111-1111-1111-1111-1111111111111"],
  ])("rejects a %s value", (_name, value) => {
    expect(parseOrderIdParam(value)).toBeNull()
  })

  it("rejects a non-hex character", () => {
    expect(parseOrderIdParam("g1111111-1111-1111-1111-111111111111")).toBeNull()
  })

  it("rejects 32 hex chars without hyphens", () => {
    expect(parseOrderIdParam("11111111111111111111111111111111")).toBeNull()
  })

  it("rejects a value wrapped in braces", () => {
    expect(parseOrderIdParam("{11111111-1111-1111-1111-111111111111}")).toBeNull()
  })

  it("accepts the nil UUID (all zeros)", () => {
    expect(parseOrderIdParam("00000000-0000-0000-0000-000000000000")).toBe("00000000-0000-0000-0000-000000000000")
  })

  it.each([
    ["SQL injection attempt", "' OR 1=1--"],
    ["script tag", "<script>alert(1)</script>"],
    ["path traversal", "../../etc/passwd"],
    ["uuid with a trailing param-injection suffix", "11111111-1111-1111-1111-111111111111&selectedTab=Delivered"],
  ])("rejects a hostile string: %s", (_name, value) => {
    expect(parseOrderIdParam(value)).toBeNull()
  })
})
