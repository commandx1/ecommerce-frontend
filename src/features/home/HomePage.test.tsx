import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@/test/render"
import HomePage from "./HomePage"

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("stacks the storefront's marketing sections", () => {
    render(<HomePage />)

    expect(screen.getByRole("heading", { name: /Trending products this week/ })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Compare trusted suppliers before you buy/ })).toBeInTheDocument()
  })

  // A11y: the hero is an image carousel with no visible title, and every section
  // heading below it is per-section (h2), so the page had zero <h1> (FINDING on
  // `/`, 27 Ağu 2026 measurement). A visually-hidden <h1> restores exactly one
  // page-level heading without changing anything a sighted user sees.
  it("has exactly one page-level h1 describing the storefront", () => {
    render(<HomePage />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("DentyPro — B2B dental supply marketplace")
  })

  it("features exactly four trending products, each linked to its detail page", () => {
    render(<HomePage />)

    const productLinks = screen
      .getAllByRole("link")
      .filter((link) => /^\/products\/\d+$/.test(link.getAttribute("href") ?? ""))
    // one title link plus one preview link per card
    expect(productLinks).toHaveLength(8)
    expect(screen.getByRole("link", { name: "Premium Composite Kit" })).toHaveAttribute("href", "/products/1")
  })

  it("routes the catalogue call to action at the full listing", () => {
    render(<HomePage />)

    expect(screen.getByRole("link", { name: /View Full Catalog/ })).toHaveAttribute("href", "/products")
  })

  it("parses the JSON price strings into numbers the card can price", () => {
    render(<HomePage />)

    // "$1,899" in the fixture — the comma must not truncate the value, and now that ProductCard
    // formats through `formatCurrency` it renders back with its own thousands separator too.
    expect(screen.getByText("$1,899.00")).toBeInTheDocument()
    expect(screen.getByText("$289.00")).toBeInTheDocument()
  })

  it("shows a saving only for the products with an original price", () => {
    render(<HomePage />)

    expect(screen.getByText("$320.00")).toBeInTheDocument()
    expect(screen.getAllByText(/^Save \d+%$/).length).toBeGreaterThan(0)
  })

  it("features three suppliers with their ratings", () => {
    render(<HomePage />)

    const heading = screen.getByRole("heading", { name: /Compare trusted suppliers before you buy/ })
    const section = heading.parentElement!
    expect(within(section).getAllByRole("button", { name: "View Catalog" })).toHaveLength(3)
    expect(within(section).getAllByText("Verified partner")).toHaveLength(3)
  })
})
