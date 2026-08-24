import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("merges conflicting Tailwind classes, keeping the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("applies conditional classes based on truthy values", () => {
    expect(cn("base", true && "active", false && "inactive")).toBe("base active")
  })

  it("ignores undefined, null and false inputs", () => {
    expect(cn("base", undefined, null, false)).toBe("base")
  })

  it("accepts array inputs", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c")
  })

  it("accepts object inputs with boolean values", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c")
  })

  it("returns an empty string when given no meaningful input", () => {
    expect(cn()).toBe("")
  })
})
