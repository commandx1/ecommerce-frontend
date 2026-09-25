import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import StatusTabStrip from "./StatusTabStrip"

const TABS = ["All", "Pending", "Shipped"] as const

describe("StatusTabStrip", () => {
  it("carries the exact wrapper and button class strings both roles relied on", () => {
    render(<StatusTabStrip tabs={TABS} value="All" onChange={vi.fn()} />)

    const button = screen.getByRole("button", { name: "All" })
    const tabRow = button.parentElement
    const outerWrapper = tabRow?.parentElement
    expect(outerWrapper).toHaveClass("mb-4")
    expect(tabRow).toHaveClass(
      "no-scrollbar",
      "flex",
      "w-full",
      "items-center",
      "gap-1.5",
      "overflow-x-auto",
      "rounded-sm",
      "border",
      "border-border-soft",
      "bg-surface",
      "p-1.5",
      "shadow-soft",
      "sm:gap-2",
    )

    expect(button).toHaveClass("bg-brand", "text-muted", "shadow-soft")
    const inactive = screen.getByRole("button", { name: "Pending" })
    expect(inactive).toHaveClass("text-text-secondary", "hover:bg-surface-muted", "hover:text-text-primary")
  })

  it("renders one button per tab, in order", () => {
    render(<StatusTabStrip tabs={TABS} value="All" onChange={vi.fn()} />)

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(TABS)
  })

  it.each(TABS)("marks '%s' active via aria-pressed and every other tab inactive", (tab) => {
    render(<StatusTabStrip tabs={TABS} value={tab} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: tab })).toHaveAttribute("aria-pressed", "true")
    for (const other of TABS.filter((candidate) => candidate !== tab)) {
      expect(screen.getByRole("button", { name: other })).toHaveAttribute("aria-pressed", "false")
    }
  })

  it("calls onChange with the clicked tab, exactly once", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusTabStrip tabs={TABS} value="All" onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "Shipped" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("Shipped")
  })

  it("does not call onChange just by rendering", () => {
    const onChange = vi.fn()
    render(<StatusTabStrip tabs={TABS} value="Pending" onChange={onChange} />)

    expect(onChange).not.toHaveBeenCalled()
  })
})
