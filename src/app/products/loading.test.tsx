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
  // matters too. The sr-only h1 above is followed by this skeleton's only
  // other heading, an sr-only h2 - no skip.
  it("has no forward heading-level skip within the skeleton itself", () => {
    render(<ProductListingLoading />)

    const levels = screen.getAllByRole("heading").map((el) => Number(el.tagName[1]))
    let previousLevel: number | undefined
    for (const level of levels) {
      if (previousLevel !== undefined) {
        expect(level - previousLevel).toBeLessThanOrEqual(1)
      }
      previousLevel = level
    }
  })
})
