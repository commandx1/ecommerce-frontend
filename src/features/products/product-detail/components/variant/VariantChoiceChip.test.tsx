import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import type { VariantChoice } from "../../types"
import VariantChoiceChip from "./VariantChoiceChip"

installRadixPointerPolyfills()

const baseChoice: VariantChoice = {
  value: "Translucent",
  selected: false,
  option: false,
  available: false,
  names: [],
}

describe("VariantChoiceChip — style states", () => {
  // Backend meaning (ProductServiceImpl.java:1041-1042): option implies available, so these are
  // the only 3 reachable combinations plus "neither" - all 4 must still render distinct classes
  // and stay clickable, including the unreachable "neither" (dashed) state.
  it.each([
    ["selected", { ...baseChoice, selected: true }, "border-warning-strong"],
    ["a full match (option)", { ...baseChoice, option: true, available: true }, "border-border-soft"],
    ["a partial match (available only)", { ...baseChoice, available: true }, "opacity-70"],
    ["no match at all", { ...baseChoice }, "border-dashed"],
  ])("gives the %s chip its own class and keeps it clickable", async (_label, choice, expectedClassFragment) => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<VariantChoiceChip attribute="Color" choice={choice} disabled={false} onSelect={onSelect} />)

    const button = screen.getByRole("button", { name: "Translucent" })
    expect(button.className).toContain(expectedClassFragment)

    await user.click(button)
    expect(onSelect).toHaveBeenCalledWith({ attribute: "Color", value: "Translucent", productName: undefined })
  })
})

describe("VariantChoiceChip — single vs. ambiguous value", () => {
  it("calls onSelect directly, with the sole name as productName, when there is exactly one name", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    const choice: VariantChoice = { ...baseChoice, option: true, available: true, names: ["Acme Translucent Kit"] }

    render(<VariantChoiceChip attribute="Color" choice={choice} disabled={false} onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: "Translucent" }))

    expect(onSelect).toHaveBeenCalledWith({
      attribute: "Color",
      value: "Translucent",
      productName: "Acme Translucent Kit",
    })
  })

  it("opens a popover of names instead of selecting when the value has more than one name", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    const choice: VariantChoice = {
      ...baseChoice,
      option: true,
      available: true,
      names: ["Acme Translucent Kit", "Acme Translucent Refill"],
    }

    render(<VariantChoiceChip attribute="Color" choice={choice} disabled={false} onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: "Translucent" }))

    expect(onSelect).not.toHaveBeenCalled()
    expect(await screen.findByRole("button", { name: "Acme Translucent Kit" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Acme Translucent Refill" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Acme Translucent Refill" }))
    expect(onSelect).toHaveBeenCalledWith({
      attribute: "Color",
      value: "Translucent",
      productName: "Acme Translucent Refill",
    })
  })
})
