import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import QuantitySelector from "./QuantitySelector"

// A11y: the +/- buttons are icon-only (lucide `Minus`/`Plus`, no visible text), so without an
// `aria-label` axe's `button-name` rule flags them and a screen reader announces only "button".
// Found on /products/p-1 (a11y-smoke.spec.ts): 3 unnamed buttons, 2 of them these.
describe("QuantitySelector", () => {
  it("exposes the decrease button by its accessible name and calls onDecrement when clicked", async () => {
    const user = userEvent.setup()
    const onDecrement = vi.fn()
    render(<QuantitySelector quantity={2} stockCount={10} onIncrement={vi.fn()} onDecrement={onDecrement} />)

    const button = screen.getByRole("button", { name: "Decrease quantity" })
    await user.click(button)

    expect(onDecrement).toHaveBeenCalledTimes(1)
  })

  it("exposes the increase button by its accessible name and calls onIncrement when clicked", async () => {
    const user = userEvent.setup()
    const onIncrement = vi.fn()
    render(<QuantitySelector quantity={2} stockCount={10} onIncrement={onIncrement} onDecrement={vi.fn()} />)

    const button = screen.getByRole("button", { name: "Increase quantity" })
    await user.click(button)

    expect(onIncrement).toHaveBeenCalledTimes(1)
  })

  it("disables the decrease button at the quantity floor and the increase button at the stock ceiling", () => {
    render(<QuantitySelector quantity={1} stockCount={1} onIncrement={vi.fn()} onDecrement={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled()
  })
})
