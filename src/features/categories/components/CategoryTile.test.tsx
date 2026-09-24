import { describe, expect, it } from "vitest"
import type { CategoryDirectoryEntry } from "@/features/categories/lib/build-category-directory"
import { render, screen } from "@/test/render"
import CategoryTile from "./CategoryTile"

const makeEntry = (overrides: Partial<CategoryDirectoryEntry> = {}): CategoryDirectoryEntry => ({
  name: "Instruments",
  count: 5,
  children: [],
  ...overrides,
})

describe("CategoryTile", () => {
  it('labels a single-product category "1 product", not "1 products"', () => {
    render(<CategoryTile entry={makeEntry({ count: 1 })} />)

    expect(screen.getByText("1 product")).toBeInTheDocument()
    expect(screen.queryByText("1 products")).not.toBeInTheDocument()
  })

  it('labels a multi-product category "N products"', () => {
    render(<CategoryTile entry={makeEntry({ count: 5 })} />)

    expect(screen.getByText("5 products")).toBeInTheDocument()
  })

  it('shows "Coming soon" instead of a count when the category has no stock', () => {
    render(<CategoryTile entry={makeEntry({ count: 0 })} />)

    expect(screen.getByText("Coming soon")).toBeInTheDocument()
  })
})
