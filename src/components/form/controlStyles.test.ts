import { describe, expect, it } from "vitest"
import { textLikeControlClassName } from "./controlStyles"

// Static class-name constant, no branching — an integrity check on its contents.
describe("textLikeControlClassName", () => {
  it("is a non-empty string", () => {
    expect(typeof textLikeControlClassName).toBe("string")
    expect(textLikeControlClassName.length).toBeGreaterThan(0)
  })

  it("defines the resting and hover border colors", () => {
    expect(textLikeControlClassName).toContain("border-border-soft/80")
    expect(textLikeControlClassName).toContain("hover:border-border-soft")
  })

  it("defines the disabled-state styling (border, background, text, shadow, opacity)", () => {
    expect(textLikeControlClassName).toContain("disabled:border-border-soft")
    expect(textLikeControlClassName).toContain("disabled:bg-surface-muted")
    expect(textLikeControlClassName).toContain("disabled:text-text-muted")
    expect(textLikeControlClassName).toContain("disabled:shadow-none")
    expect(textLikeControlClassName).toContain("disabled:opacity-100")
  })
})
