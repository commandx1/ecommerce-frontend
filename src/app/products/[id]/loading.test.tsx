import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import ProductDetailLoading from "./loading"

// A11y: `/products/[id]` is `force-dynamic` + an async Server Component, so Next streams this
// skeleton (loading.tsx) first while the real page (ProductHeroDetails' `<h1>{product.title}</h1>`)
// is still fetching data. axe scanning /products/p-1 at `domcontentloaded` consistently caught
// this skeleton, not the loaded page ("expected exactly 1 <h1> on /products/p-1, found 0"). The
// product's own title isn't known here (no id-specific fetch in a route-level loading.tsx), so
// this uses a generic, visually-hidden title rather than guessing at the real one.
describe("ProductDetailLoading", () => {
  it("has exactly one h1, distinct from the loaded page's product-title h1", () => {
    render(<ProductDetailLoading />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Loading Product Details")
  })

  // The root layout's persistent <Footer> renders its own <h3>s ("Products"/"Services"/"Support")
  // regardless of which page content is showing, including this skeleton. With nothing between
  // this file's h1 and that footer, mobile-chrome's a11y scan (which lands on this skeleton, not
  // the resolved page) saw a straight h1 -> h3 jump. The "Fetching product details..." status text
  // is promoted to h2 to bridge that gap - same fix as F88's /products/loading.tsx ("Fetching
  // Products" h3 -> h2). This only checks ordering/levels WITHIN the skeleton itself; the footer's
  // h3 is a separate, persistent element the a11y-smoke e2e spec covers end-to-end.
  it("keeps its own headings in order with no level skip (h1 then h2, no jump to h3+)", () => {
    render(<ProductDetailLoading />)

    const headings = screen.getAllByRole("heading")
    expect(headings.map((h) => Number(h.tagName[1]))).toEqual([1, 2])
    expect(headings[1]).toHaveTextContent("Fetching product details...")
  })
})
