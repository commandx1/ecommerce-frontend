import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor } from "@/test/render"
import type { VariantChoice } from "../../types"
import VariantNamePopover from "./VariantNamePopover"

installRadixPointerPolyfills()

// VariantChoiceChip.test.tsx already covers: the trigger opening the popover on click, the
// popover listing every name, and a name click calling onSelect - all driven through
// VariantChoiceChip. These tests exercise VariantNamePopover directly, so they cover what that
// suite doesn't: an ambiguous 3-name list, the exact onSelect payload shape, and the popover's
// close behaviours (Escape, outside click, re-selecting a name closes it too).

const baseChoice: VariantChoice = {
  value: "200/Pk.",
  selected: false,
  option: true,
  available: true,
  names: ["MARK3 Mixing Tips 200/Pk. White", "MARK3 Mixing Tips 200/Pk. Yellow", "MARK3 Mixing Tips 200/Pk. Blue"],
}

function renderPopover(overrides: Partial<VariantChoice> = {}, disabled = false) {
  const onSelect = vi.fn()
  const choice: VariantChoice = { ...baseChoice, ...overrides }
  const utils = render(
    <VariantNamePopover
      attribute="Packaging"
      choice={choice}
      disabled={disabled}
      triggerClassName="trigger"
      onSelect={onSelect}
    />,
  )
  return { ...utils, onSelect, choice }
}

describe("VariantNamePopover", () => {
  it("renders one option per name once opened", async () => {
    const user = userEvent.setup()
    renderPopover()

    await user.click(screen.getByRole("button", { name: "200/Pk." }))

    expect(await screen.findByRole("button", { name: "MARK3 Mixing Tips 200/Pk. White" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "MARK3 Mixing Tips 200/Pk. Yellow" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "MARK3 Mixing Tips 200/Pk. Blue" })).toBeInTheDocument()
  })

  it("calls onSelect with { attribute, value, productName } for the chosen name and closes", async () => {
    const user = userEvent.setup()
    const { onSelect } = renderPopover()

    await user.click(screen.getByRole("button", { name: "200/Pk." }))
    await user.click(await screen.findByRole("button", { name: "MARK3 Mixing Tips 200/Pk. Yellow" }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith({
      attribute: "Packaging",
      value: "200/Pk.",
      productName: "MARK3 Mixing Tips 200/Pk. Yellow",
    })
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "MARK3 Mixing Tips 200/Pk. Yellow" })).not.toBeInTheDocument(),
    )
  })

  it("closes the popover on Escape without calling onSelect", async () => {
    const user = userEvent.setup()
    const { onSelect } = renderPopover()

    await user.click(screen.getByRole("button", { name: "200/Pk." }))
    await screen.findByRole("button", { name: "MARK3 Mixing Tips 200/Pk. White" })

    await user.keyboard("{Escape}")

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "MARK3 Mixing Tips 200/Pk. White" })).not.toBeInTheDocument(),
    )
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("closes the popover on an outside click without calling onSelect", async () => {
    const user = userEvent.setup()
    const { onSelect } = renderPopover()

    await user.click(screen.getByRole("button", { name: "200/Pk." }))
    await screen.findByRole("button", { name: "MARK3 Mixing Tips 200/Pk. White" })

    await user.click(document.body)

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "MARK3 Mixing Tips 200/Pk. White" })).not.toBeInTheDocument(),
    )
    expect(onSelect).not.toHaveBeenCalled()
  })

  // The trigger's real click/hover-open guard is CSS (`disabled:pointer-events-none`, supplied
  // by the caller's `triggerClassName` - VariantChoiceChip always includes it): a disabled
  // native button still dispatches pointerenter/pointerover in real browsers, only pointer-events
  // CSS stops the hover-open. jsdom applies no stylesheet in this test, so that CSS guard can't
  // be exercised here; what the component itself controls - and what this pins - is that the
  // `disabled` prop reaches the trigger and every rendered name option as a real DOM attribute.
  it("renders the trigger and every name option as disabled when disabled is true", async () => {
    const user = userEvent.setup()
    renderPopover({}, true)

    const trigger = screen.getByRole("button", { name: "200/Pk." })
    expect(trigger).toBeDisabled()

    await user.click(trigger)

    for (const name of baseChoice.names) {
      expect(await screen.findByRole("button", { name })).toBeDisabled()
    }
  })
})
