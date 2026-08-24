import { describe, expect, it } from "vitest"
import { KNOWLEDGE_BASE_CATEGORIES } from "./knowledgeBaseCategories"

// No conditional logic here — this is a static data export. Coverage is a
// structural/integrity check: every category is well-formed and internally consistent.
describe("KNOWLEDGE_BASE_CATEGORIES", () => {
  it("contains exactly six categories", () => {
    expect(KNOWLEDGE_BASE_CATEGORIES).toHaveLength(6)
  })

  it("gives every category a non-empty title, icon, and styling classes", () => {
    for (const category of KNOWLEDGE_BASE_CATEGORIES) {
      expect(category.title.length).toBeGreaterThan(0)
      expect(category.icon).toBeTruthy()
      expect(category.iconBg.length).toBeGreaterThan(0)
      expect(category.iconColor.length).toBeGreaterThan(0)
    }
  })

  it("gives every category exactly 5 article titles, each non-empty", () => {
    for (const category of KNOWLEDGE_BASE_CATEGORIES) {
      expect(category.articles).toHaveLength(5)
      for (const article of category.articles) {
        expect(article.length).toBeGreaterThan(0)
      }
    }
  })

  it("gives every category a positive article count", () => {
    for (const category of KNOWLEDGE_BASE_CATEGORIES) {
      expect(category.count).toBeGreaterThan(0)
    }
  })

  it("has unique, non-empty category titles", () => {
    const titles = KNOWLEDGE_BASE_CATEGORIES.map((c) => c.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it("includes the expected category titles in order", () => {
    expect(KNOWLEDGE_BASE_CATEGORIES.map((c) => c.title)).toEqual([
      "Getting Started",
      "Ordering & Purchasing",
      "Shipping & Delivery",
      "Returns & Exchanges",
      "Billing & Payment",
      "Account Management",
    ])
  })
})
