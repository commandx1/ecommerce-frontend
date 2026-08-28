import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import SortSelect from "./SortSelect"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("../../hooks/useProductFiltersNavigation", () => ({
  useProductFiltersNavigation: () => ({ isPending: false, startNavigation: (run: () => void) => run() }),
}))

describe("SortSelect", () => {
  /**
   * The trigger's only text is the selected option, and Radix fills that in on the client - until
   * then the control has no accessible name at all, which axe reported as `button-name` on
   * /products. A screen-reader user also needs to know WHAT is being sorted; "Best Match" alone
   * never said that.
   */
  it("names the control for assistive technology, independently of the selected option", () => {
    render(<SortSelect />)

    expect(screen.getByRole("combobox", { name: "Sort products" })).toBeInTheDocument()
  })
})
