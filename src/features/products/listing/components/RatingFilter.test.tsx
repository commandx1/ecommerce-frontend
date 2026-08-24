import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lastPushedParams, renderWithFilterNavigation } from "@/test/harness/filter-navigation-harness"
import { screen } from "@/test/render"
import RatingFilter from "./RatingFilter"

const renderFilter = (searchParams = "") => renderWithFilterNavigation(<RatingFilter />, searchParams)

describe("RatingFilter", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("offers the three rating thresholds unchecked by default", () => {
    renderFilter()

    for (const label of ["5 Stars", "4+ Stars", "3+ Stars"]) {
      expect(screen.getByLabelText(label)).not.toBeChecked()
    }
  })

  it("picking a threshold writes minRating and resets the page", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter("page=3")

    await user.click(screen.getByLabelText("4+ Stars"))

    const params = lastPushedParams(router)
    expect(params.get("minRating")).toBe("4")
    expect(params.get("page")).toBe("1")
  })

  it("behaves as a single choice — a second threshold replaces the first", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter("minRating=4")

    expect(screen.getByLabelText("4+ Stars")).toBeChecked()
    await user.click(screen.getByLabelText("3+ Stars"))

    expect(lastPushedParams(router).get("minRating")).toBe("3")
  })

  it("re-clicking the active threshold clears it", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter("minRating=5")

    await user.click(screen.getByLabelText("5 Stars"))

    expect(lastPushedParams(router).has("minRating")).toBe(false)
  })

  it("clears the rating through the section's Clear action", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter("minRating=3")

    await user.click(screen.getByRole("button", { name: "Clear" }))

    expect(lastPushedParams(router).has("minRating")).toBe(false)
  })
})
