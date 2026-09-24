import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import CartEmptyState from "./CartEmptyState"

describe("CartEmptyState", () => {
  it("carries its own page-level h1, separate from the empty-state card's h2 title", () => {
    render(<CartEmptyState onContinueShopping={vi.fn()} />)

    // Regression guard for the a11y-smoke FINDING "expected exactly 1 <h1> on
    // /cart, found 0". EmptyStateCard's "Your Cart is Empty" title is
    // intentionally an h2 (F56 - it's a section card reused on other pages,
    // not the page heading), so the empty-cart view needs its own h1 or the
    // page ends up with none at all.
    expect(screen.getByRole("heading", { level: 1, name: "Shopping Cart" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Your Cart is Empty" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("renders a main landmark, like the loaded and loading cart views do", () => {
    render(<CartEmptyState onContinueShopping={vi.fn()} />)

    // Same finding class as the h1 above, caught later: this was the ONE /cart state without a
    // main landmark (CartContent and CartLoadingState both use PageSectionContainer as="main",
    // this one used as="div"), leaving a screen-reader user with no "skip to main content"
    // target on an empty cart. a11y-smoke only sees it on a run where the cart is actually empty.
    expect(screen.getByRole("main")).toBeInTheDocument()
  })
})
