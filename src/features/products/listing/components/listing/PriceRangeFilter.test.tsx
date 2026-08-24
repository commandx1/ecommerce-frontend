import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lastPushedParams, renderWithFilterNavigation } from "@/test/harness/filter-navigation-harness"
import { screen } from "@/test/render"
import PriceRangeFilter from "./PriceRangeFilter"

const renderFilter = (searchParams = "") => renderWithFilterNavigation(<PriceRangeFilter />, searchParams)

const minInput = () => screen.getByPlaceholderText("0")
const maxInput = () => screen.getByPlaceholderText("Any")

describe("PriceRangeFilter", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("seeds both inputs from the URL", () => {
    renderFilter("minPrice=25&maxPrice=300")

    expect(minInput()).toHaveValue(25)
    expect(maxInput()).toHaveValue(300)
  })

  it("applies a typed custom range when the field loses focus", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter()

    await user.type(minInput(), "40")
    await user.tab()

    const params = lastPushedParams(router)
    expect(params.get("minPrice")).toBe("40")
    expect(params.has("maxPrice")).toBe(false)
  })

  it("applies the range on Enter without waiting for blur", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter()

    await user.type(maxInput(), "150{Enter}")

    expect(lastPushedParams(router).get("maxPrice")).toBe("150")
  })

  // FIX: an inverted range (min > max) is rejected instead of silently producing an empty
  // listing. The last-known-good range stays applied, the invalid bound is not pushed to the
  // URL, and the user is told why via an inline, accessible error.
  it("rejects an inverted range with an inline error instead of pushing it to the URL", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter()

    await user.type(minInput(), "500")
    await user.tab()
    await user.type(maxInput(), "100{Enter}")

    expect(screen.getByText(/must not be greater than/i)).toBeInTheDocument()
    expect(maxInput()).toHaveAttribute("aria-invalid", "true")
    expect(maxInput()).toHaveAttribute("aria-describedby")
    expect(minInput()).toHaveAttribute("aria-describedby", maxInput().getAttribute("aria-describedby"))

    const params = lastPushedParams(router)
    expect(params.get("minPrice")).toBe("500")
    expect(params.has("maxPrice")).toBe(false)
  })

  it("clears the inverted-range error once the user edits a bound", async () => {
    const user = userEvent.setup()
    renderFilter()

    await user.type(minInput(), "500")
    await user.tab()
    await user.type(maxInput(), "100{Enter}")
    expect(screen.getByText(/must not be greater than/i)).toBeInTheDocument()

    await user.type(maxInput(), "0")

    expect(screen.queryByText(/must not be greater than/i)).not.toBeInTheDocument()
  })

  it("selects a preset range and reflects it in both inputs", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter()

    await user.click(screen.getByLabelText("$50 – $200"))

    const params = lastPushedParams(router)
    expect(params.get("minPrice")).toBe("50")
    expect(params.get("maxPrice")).toBe("200")
    expect(minInput()).toHaveValue(50)
    expect(maxInput()).toHaveValue(200)
  })

  it("drops the lower bound entirely for the Under $50 preset", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter()

    await user.click(screen.getByLabelText("Under $50"))

    const params = lastPushedParams(router)
    expect(params.has("minPrice")).toBe(false)
    expect(params.get("maxPrice")).toBe("50")
  })

  it("leaves the upper bound open for the Over $1,000 preset", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter()

    await user.click(screen.getByLabelText("Over $1,000"))

    const params = lastPushedParams(router)
    expect(params.get("minPrice")).toBe("1000")
    expect(params.has("maxPrice")).toBe(false)
  })

  it("marks the preset that matches the current URL", () => {
    renderFilter("minPrice=200&maxPrice=500")

    expect(screen.getByLabelText("$200 – $500")).toBeChecked()
    expect(screen.getByLabelText("$50 – $200")).not.toBeChecked()
  })

  it("offers no clear action while no price bound is set", () => {
    renderFilter()

    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument()
  })

  it("clears both bounds and empties the inputs", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter("minPrice=25")

    await user.click(screen.getByRole("button", { name: "Clear" }))

    const params = lastPushedParams(router)
    expect(params.has("minPrice")).toBe(false)
    expect(params.has("maxPrice")).toBe(false)
    expect(minInput()).toHaveValue(null)
  })
})
