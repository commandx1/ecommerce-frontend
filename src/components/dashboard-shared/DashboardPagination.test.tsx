import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import DashboardPagination from "./DashboardPagination"

const renderPagination = (overrides: Partial<React.ComponentProps<typeof DashboardPagination>> = {}) => {
  const onPageChange = vi.fn()
  render(
    <DashboardPagination
      currentPage={0}
      totalPages={5}
      totalElements={48}
      pageSize={10}
      onPageChange={onPageChange}
      {...overrides}
    />,
  )
  return onPageChange
}

const pageButtonLabels = () =>
  screen
    .queryAllByRole("button")
    .map((button) => button.textContent?.trim() ?? "")
    .filter((label) => /^\d+$/.test(label))

describe("DashboardPagination", () => {
  it("describes the visible slice of the result set", () => {
    renderPagination({ currentPage: 2, pageSize: 10, totalElements: 48 })

    expect(screen.getByText("Showing 21 to 30 of 48 results")).toBeInTheDocument()
  })

  it("caps the upper bound at the total on the last page", () => {
    renderPagination({ currentPage: 4, pageSize: 10, totalElements: 48 })

    expect(screen.getByText("Showing 41 to 48 of 48 results")).toBeInTheDocument()
  })

  it("says zero results rather than 'showing 0 to 0 of 0'", () => {
    renderPagination({ totalElements: 0, totalPages: 0 })

    expect(screen.getByText("Showing 0 results")).toBeInTheDocument()
  })

  it("hides the page controls when everything fits on one page", () => {
    renderPagination({ totalPages: 1, totalElements: 5, pageSize: 10 })

    expect(screen.queryByLabelText("Go to next page")).not.toBeInTheDocument()
    expect(pageButtonLabels()).toEqual([])
  })

  it("renders one button per page while there are seven or fewer", () => {
    renderPagination({ totalPages: 7, totalElements: 70 })

    expect(pageButtonLabels()).toEqual(["1", "2", "3", "4", "5", "6", "7"])
  })

  it("collapses distant pages behind an ellipsis for long result sets", () => {
    renderPagination({ currentPage: 5, totalPages: 12, totalElements: 120 })

    // first, neighbours of the current page, last — with gaps elided
    expect(pageButtonLabels()).toEqual(["1", "5", "6", "7", "12"])
    expect(screen.getAllByText("More pages").length).toBeGreaterThan(0)
  })

  it("reports zero-indexed pages when a page number is clicked", async () => {
    const user = userEvent.setup()
    const onPageChange = renderPagination({ currentPage: 0, totalPages: 5 })

    await user.click(screen.getByRole("button", { name: "3" }))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("steps forward and backward without running past the ends", async () => {
    const user = userEvent.setup()
    const onPageChange = renderPagination({ currentPage: 2, totalPages: 5 })

    await user.click(screen.getByLabelText("Go to next page"))
    expect(onPageChange).toHaveBeenLastCalledWith(3)

    await user.click(screen.getByLabelText("Go to previous page"))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
  })

  it("marks previous as disabled on the first page", async () => {
    const user = userEvent.setup()
    const onPageChange = renderPagination({ currentPage: 0, totalPages: 5 })

    const previous = screen.getByLabelText("Go to previous page")
    expect(previous).toHaveAttribute("aria-disabled", "true")

    await user.click(previous)
    // Clamped rather than going negative
    expect(onPageChange).toHaveBeenCalledWith(0)
  })

  it("marks next as disabled on the last page", () => {
    renderPagination({ currentPage: 4, totalPages: 5 })

    expect(screen.getByLabelText("Go to next page")).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByLabelText("Go to previous page")).toHaveAttribute("aria-disabled", "false")
  })
})
