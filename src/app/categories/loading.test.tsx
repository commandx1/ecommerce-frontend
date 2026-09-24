import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import CategoriesLoading from "./loading"

// A11y: `/categories` is an async Server Component (`await getProductCategoryOptions()`), so Next
// streams this skeleton first. It is the only catalogue route where that actually happens -
// /cart, /checkout and /vendors render synchronously and fetch on the client, which is why they
// have no loading.tsx. Same contract as src/app/products/loading.test.tsx.
describe("CategoriesLoading", () => {
  it("has exactly one h1 matching the loaded page's title", () => {
    render(<CategoriesLoading />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Dental Supply Categories")
  })

  // The skeleton stays in the DOM (invisible) after the real page streams in, so a raw heading
  // scan still walks it. The persistent <Footer> contributes <h3>s, so an h1 with nothing between
  // it and the footer would read as an h1 -> h3 skip; the sr-only h2 is what bridges that.
  it("has no forward heading-level skip within the skeleton itself", () => {
    render(<CategoriesLoading />)

    const levels = screen.getAllByRole("heading").map((el) => Number(el.tagName[1]))
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
  })

  it("marks the placeholder region as busy so assistive tech is not left guessing", () => {
    const { container } = render(<CategoriesLoading />)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it("renders skeleton tiles through the shared primitive, not ad-hoc markup", () => {
    const { container } = render(<CategoriesLoading />)

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })
})
