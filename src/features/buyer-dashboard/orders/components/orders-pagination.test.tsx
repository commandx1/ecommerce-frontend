import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import OrdersPagination from "./orders-pagination"

const mockUseBuyerOrdersPaginationSelector = vi.fn()
const mockUseBuyerOrdersPaginationActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersPaginationSelector: (
    selector: (state: ReturnType<typeof mockUseBuyerOrdersPaginationSelector>) => unknown,
  ) => selector(mockUseBuyerOrdersPaginationSelector()),
  useBuyerOrdersPaginationActions: () => mockUseBuyerOrdersPaginationActions(),
}))

/**
 * The prev/next controls are shadcn `PaginationPrevious`/`PaginationNext` anchors. They have no
 * `href`, so they expose no implicit ARIA role and `getByRole("button" | "link")` cannot reach
 * them — `getByLabelText` against their `aria-label` is the closest accessible query available.
 * See the a11y note in the accompanying report.
 */
const PREV_LABEL = "Go to previous page"
const NEXT_LABEL = "Go to next page"

function createStateValue(overrides?: Partial<ReturnType<typeof mockUseBuyerOrdersPaginationSelector>>) {
  return {
    currentPage: 1,
    pageSize: 10,
    totalElements: 35,
    totalPages: 4,
    ...overrides,
  }
}

beforeEach(() => {
  mockUseBuyerOrdersPaginationSelector.mockReset()
  mockUseBuyerOrdersPaginationActions.mockReset()
})

describe("OrdersPagination", () => {
  it("renders count summary text", () => {
    mockUseBuyerOrdersPaginationSelector.mockReturnValue(createStateValue())
    mockUseBuyerOrdersPaginationActions.mockReturnValue({ handlePageChange: vi.fn() })

    render(<OrdersPagination />)

    expect(screen.getByText("Showing 11 to 20 of 35 results")).toBeInTheDocument()
  })

  it("marks prev/next as disabled at boundaries", () => {
    mockUseBuyerOrdersPaginationSelector.mockReturnValue(createStateValue({ currentPage: 0 }))
    mockUseBuyerOrdersPaginationActions.mockReturnValue({ handlePageChange: vi.fn() })
    const { rerender } = render(<OrdersPagination />)

    // `DashboardPagination` renders prev/next through shadcn's `PaginationPrevious`/`PaginationNext`,
    // which express the boundary state with `aria-disabled` rather than the `disabled` attribute.
    expect(screen.getByLabelText(PREV_LABEL)).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByLabelText(NEXT_LABEL)).toHaveAttribute("aria-disabled", "false")

    mockUseBuyerOrdersPaginationSelector.mockReturnValue(createStateValue({ currentPage: 3 }))
    rerender(<OrdersPagination />)

    expect(screen.getByLabelText(PREV_LABEL)).toHaveAttribute("aria-disabled", "false")
    expect(screen.getByLabelText(NEXT_LABEL)).toHaveAttribute("aria-disabled", "true")
  })

  it("calls handlePageChange for prev, next and index buttons", async () => {
    const user = userEvent.setup()
    const handlePageChange = vi.fn()
    mockUseBuyerOrdersPaginationSelector.mockReturnValue(createStateValue())
    mockUseBuyerOrdersPaginationActions.mockReturnValue({ handlePageChange })

    render(<OrdersPagination />)

    await user.click(screen.getByLabelText(PREV_LABEL))
    await user.click(screen.getByLabelText(NEXT_LABEL))
    await user.click(screen.getByRole("button", { name: "3" }))

    expect(handlePageChange).toHaveBeenNthCalledWith(1, 0)
    expect(handlePageChange).toHaveBeenNthCalledWith(2, 2)
    expect(handlePageChange).toHaveBeenNthCalledWith(3, 2)
  })
})
