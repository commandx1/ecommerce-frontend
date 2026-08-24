import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lastPushedParams, renderWithFilterNavigation } from "@/test/harness/filter-navigation-harness"
import { screen } from "@/test/render"
import AvailabilityFilter from "./AvailabilityFilter"

const renderFilter = (searchParams = "") => renderWithFilterNavigation(<AvailabilityFilter />, searchParams)

describe("AvailabilityFilter", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("treats a URL without the parameter as in-stock only", () => {
    renderFilter()

    expect(screen.getByLabelText("In Stock")).toBeChecked()
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument()
  })

  it("unticking in-stock writes inStock=false to the URL", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter()

    await user.click(screen.getByLabelText("In Stock"))

    expect(lastPushedParams(router).get("inStock")).toBe("false")
  })

  it("re-ticking in-stock drops the parameter rather than sending true", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter("inStock=false")

    expect(screen.getByLabelText("In Stock")).not.toBeChecked()
    await user.click(screen.getByLabelText("In Stock"))

    expect(lastPushedParams(router).has("inStock")).toBe(false)
  })

  it("offers a clear action only while out-of-stock items are included", async () => {
    const user = userEvent.setup()
    const { router } = renderFilter("inStock=false")

    await user.click(screen.getByRole("button", { name: "Clear" }))

    expect(lastPushedParams(router).has("inStock")).toBe(false)
  })
})
