import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { makeAutoOrder } from "@/test/factories"
import { render, screen } from "@/test/render"
import AutoOrderCard from "./AutoOrderCard"

const renderCard = (props: Partial<React.ComponentProps<typeof AutoOrderCard>> = {}) => {
  const handlers = {
    onEdit: vi.fn(),
    onToggleActive: vi.fn(),
    onRequestDelete: vi.fn(),
  }

  render(<AutoOrderCard autoOrder={makeAutoOrder()} isPending={false} canActivate {...handlers} {...props} />)

  return handlers
}

describe("AutoOrderCard", () => {
  it("shows the per-delivery maths using formatted currency", () => {
    renderCard({ autoOrder: makeAutoOrder({ price: 80, quantity: 2 }) })

    expect(screen.getByText("$80.00")).toBeInTheDocument()
    expect(screen.getByText("$160.00")).toBeInTheDocument()
  })

  it("offers Pause for an active schedule and reports the toggle", async () => {
    const user = userEvent.setup()
    const handlers = renderCard({ autoOrder: makeAutoOrder({ active: true }) })

    expect(screen.queryByText("Paused")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /pause/i }))

    expect(handlers.onToggleActive).toHaveBeenCalledTimes(1)
  })

  it("offers Resume for a paused schedule when the buyer is ready to run auto orders", async () => {
    const user = userEvent.setup()
    const handlers = renderCard({ autoOrder: makeAutoOrder({ active: false }), canActivate: true })

    expect(screen.getByText("Paused")).toBeInTheDocument()
    const resume = screen.getByRole("button", { name: /resume/i })
    expect(resume).toBeEnabled()

    await user.click(resume)
    expect(handlers.onToggleActive).toHaveBeenCalledTimes(1)
  })

  it("blocks Resume while the buyer cannot run auto orders", () => {
    const handlers = renderCard({ autoOrder: makeAutoOrder({ active: false }), canActivate: false })

    expect(screen.getByRole("button", { name: /resume/i })).toBeDisabled()
    expect(handlers.onToggleActive).not.toHaveBeenCalled()
  })

  it("disables every action while the row has a request in flight", () => {
    renderCard({ isPending: true })

    expect(screen.getByRole("button", { name: /edit/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /pause/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /remove/i })).toBeDisabled()
  })

  it("forwards edit and remove requests with the auto order", async () => {
    const user = userEvent.setup()
    const autoOrder = makeAutoOrder()
    const handlers = renderCard({ autoOrder })

    await user.click(screen.getByRole("button", { name: /edit/i }))
    await user.click(screen.getByRole("button", { name: /remove/i }))

    expect(handlers.onEdit).toHaveBeenCalledWith(autoOrder)
    expect(handlers.onRequestDelete).toHaveBeenCalledWith(autoOrder)
  })

  it("falls back to a placeholder title when the product is gone", () => {
    renderCard({
      autoOrder: makeAutoOrder({ productName: null as unknown as string, sellerName: null as unknown as string }),
    })

    expect(screen.getByRole("heading", { name: "Product no longer available" })).toBeInTheDocument()
    expect(screen.queryByText(/Sold by/)).not.toBeInTheDocument()
  })
})
