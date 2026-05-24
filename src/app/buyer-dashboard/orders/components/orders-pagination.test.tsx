import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import OrdersPagination from "./orders-pagination"

describe("OrdersPagination", () => {
  it("renders count summary text", () => {
    render(<OrdersPagination currentPage={1} onPageChange={vi.fn()} pageSize={10} totalElements={35} totalPages={4} />)

    expect(screen.getByText("Showing 11 to 20 of 35 results")).toBeInTheDocument()
  })

  it("disables prev/next correctly at boundaries", () => {
    const { rerender } = render(
      <OrdersPagination currentPage={0} onPageChange={vi.fn()} pageSize={10} totalElements={35} totalPages={4} />,
    )

    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled()

    rerender(
      <OrdersPagination currentPage={3} onPageChange={vi.fn()} pageSize={10} totalElements={35} totalPages={4} />,
    )

    expect(screen.getByRole("button", { name: "Prev" })).not.toBeDisabled()
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("calls onPageChange for prev, next and index buttons", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <OrdersPagination currentPage={1} onPageChange={onPageChange} pageSize={10} totalElements={35} totalPages={4} />,
    )

    await user.click(screen.getByRole("button", { name: "Prev" }))
    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "3" }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 0)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2)
    expect(onPageChange).toHaveBeenNthCalledWith(3, 2)
  })
})
