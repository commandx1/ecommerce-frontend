import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import CartLoadingState from "./CartLoadingState"

describe("CartLoadingState", () => {
  it("exposes a single page-level h1 while the cart/license fetch is in flight", () => {
    render(<CartLoadingState />)

    // Regression guard for the a11y-smoke FINDING "expected exactly 1 <h1> on
    // /cart, found 0": CartPage renders this loading view before CartContent
    // or CartEmptyState mount, so it must carry its own (sr-only) h1 or the
    // page has zero headings for the whole loading window.
    expect(screen.getByRole("heading", { level: 1, name: "Loading Shopping Cart" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })
})
