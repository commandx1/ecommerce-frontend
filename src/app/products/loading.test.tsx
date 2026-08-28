import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import ProductListingLoading from "./loading"

// A11y: `/products` is `force-dynamic` + an async Server Component, so Next
// streams this skeleton (loading.tsx) first while the real page (with
// ProductListingHeader's `<h1>Dental Products</h1>`) is still fetching data.
// A scan/screen-reader that lands during that window used to see zero <h1>
// (FINDING: "expected exactly 1 <h1> on /products, found 0" - the a11y-smoke
// scan's `domcontentloaded` wait consistently caught this skeleton, not the
// loaded page). The visually-hidden heading here closes that gap and matches
// the real page's h1 text so there's never a mismatched title either.
describe("ProductListingLoading", () => {
  it("has exactly one h1 matching the loaded page's title", () => {
    render(<ProductListingLoading />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Dental Products")
  })

  // A11y: this skeleton stays in the DOM (invisible, but still picked up by a
  // raw `querySelectorAll("h1,...,h6")` heading-level-skip check) even after
  // the real page has streamed in and replaced it, so ITS OWN heading order
  // matters too. The sr-only h1 above used to be followed directly by this
  // skeleton's only other heading, an h3 ("Fetching Products") - an h1 -> h3
  // skip entirely self-inflicted by adding the h1. Promoted to h2.
  it("has no forward heading-level skip within the skeleton itself", () => {
    render(<ProductListingLoading />)

    const levels = screen.getAllByRole("heading").map((el) => Number(el.tagName[1]))
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
  })

  // A11y: `text-text-muted` (~4.8-5.3:1 on this card's `bg-surface`) is already
  // WCAG AA's floor; putting the whole "Ready" step row at `opacity-40` blended
  // it down to ~1.7:1 (axe `color-contrast`, 1 node on `/products`). The dimmed
  // "not reached yet" look now lives on the step's icon only, not its text.
  it("keeps the 'Ready' step's text at full, readable opacity", () => {
    render(<ProductListingLoading />)

    const readyText = screen.getByText("Ready")
    expect(readyText.parentElement).not.toHaveClass("opacity-40")
  })
})
