import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import OrdersPagination from "./orders-pagination"

const mockUseBuyerOrdersPaginationSelector = vi.fn()
const mockUseBuyerOrdersPaginationActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersPaginationSelector: (selector: (state: ReturnType<typeof mockUseBuyerOrdersPaginationSelector>) => unknown) =>
    selector(mockUseBuyerOrdersPaginationSelector()),
  useBuyerOrdersPaginationActions: () => mockUseBuyerOrdersPaginationActions(),
}))

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

  it("disables prev/next correctly at boundaries", () => {
    mockUseBuyerOrdersPaginationSelector.mockReturnValue(createStateValue({ currentPage: 0 }))
    mockUseBuyerOrdersPaginationActions.mockReturnValue({ handlePageChange: vi.fn() })
    const { rerender } = render(<OrdersPagination />)

    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled()

    mockUseBuyerOrdersPaginationSelector.mockReturnValue(createStateValue({ currentPage: 3 }))
    rerender(<OrdersPagination />)

    expect(screen.getByRole("button", { name: "Prev" })).not.toBeDisabled()
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("calls handlePageChange for prev, next and index buttons", async () => {
    const user = userEvent.setup()
    const handlePageChange = vi.fn()
    mockUseBuyerOrdersPaginationSelector.mockReturnValue(createStateValue())
    mockUseBuyerOrdersPaginationActions.mockReturnValue({ handlePageChange })

    render(<OrdersPagination />)

    await user.click(screen.getByRole("button", { name: "Prev" }))
    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "3" }))

    expect(handlePageChange).toHaveBeenNthCalledWith(1, 0)
    expect(handlePageChange).toHaveBeenNthCalledWith(2, 2)
    expect(handlePageChange).toHaveBeenNthCalledWith(3, 2)
  })
})
