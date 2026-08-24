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
