import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { makeAutoOrder } from "@/test/factories"
import { render, screen } from "@/test/render"
import AutoOrderEditModal from "./AutoOrderEditModal"

describe("AutoOrderEditModal", () => {
  it("stays closed when there is no auto order to edit", () => {
    render(<AutoOrderEditModal autoOrder={null} isSaving={false} onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByRole("heading", { name: "Edit auto order" })).not.toBeInTheDocument()
  })

  it("seeds the form from the auto order and saves the edited quantity", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const autoOrder = makeAutoOrder({ id: "ao-9", quantity: 2, price: 80, period: "ONE_MONTH" })

    render(<AutoOrderEditModal autoOrder={autoOrder} isSaving={false} onClose={vi.fn()} onSave={onSave} />)

    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("$160.00 per delivery")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Increase quantity" }))
    expect(screen.getByText("$240.00 per delivery")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Save changes" }))
    expect(onSave).toHaveBeenCalledWith("ao-9", 3, "ONE_MONTH")
  })

  it("never lets the quantity drop below one", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <AutoOrderEditModal
        autoOrder={makeAutoOrder({ id: "ao-1", quantity: 1 })}
        isSaving={false}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }))
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(onSave).toHaveBeenCalledWith("ao-1", 1, expect.any(String))
  })

  // NOTE: the "changing the frequency restarts the countdown" warning is not covered here.
  // Opening the Radix Select trigger inside the Radix Dialog hangs jsdom indefinitely
  // (no PointerEvent capture API), so the frequency dropdown is only asserted statically.
  it("shows the schedule's current frequency in the dropdown", () => {
    render(
      <AutoOrderEditModal
        autoOrder={makeAutoOrder({ period: "TWO_WEEKS" })}
        isSaving={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByRole("combobox", { name: "Auto order frequency" })).toHaveTextContent("Every 15 days")
    expect(screen.queryByText(/restarts the countdown/)).not.toBeInTheDocument()
  })

  it("locks the controls while a save is in flight", () => {
    render(<AutoOrderEditModal autoOrder={makeAutoOrder()} isSaving onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument()
  })

  it("closes without saving when the buyer cancels", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSave = vi.fn()
    render(<AutoOrderEditModal autoOrder={makeAutoOrder()} isSaving={false} onClose={onClose} onSave={onSave} />)

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })
})
