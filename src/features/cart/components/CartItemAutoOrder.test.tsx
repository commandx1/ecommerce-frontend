import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor } from "@/test/render"
import CartItemAutoOrder from "./CartItemAutoOrder"

installRadixPointerPolyfills()

const AUTO_ORDER_CHECKBOX = /Auto-reorder this item/i
const FREQUENCY_TRIGGER = /Auto-reorder frequency/i

/** `pointerEventsCheck: 0` — Radix marks `<body>` as `pointer-events: none` while a Select is open. */
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe("CartItemAutoOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("offers no frequency picker until the schedule is switched on", () => {
    render(<CartItemAutoOrder userProductId="up-1" value={null} onChange={vi.fn()} />)

    expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).not.toBeChecked()
    expect(screen.queryByRole("combobox", { name: FREQUENCY_TRIGGER })).not.toBeInTheDocument()
    expect(screen.getByText(/Save time on supplies you use regularly/i)).toBeInTheDocument()
  })

  it("saves the default 30-day period when the schedule is switched on", async () => {
    const user = setupUser()
    const onChange = vi.fn().mockResolvedValue(undefined)
    render(<CartItemAutoOrder userProductId="up-42" value={null} onChange={onChange} />)

    await user.click(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX }))

    expect(onChange).toHaveBeenCalledWith("up-42", "ONE_MONTH")
    expect(await screen.findByRole("combobox", { name: FREQUENCY_TRIGGER })).toHaveTextContent("Every 30 days")
    expect(screen.getByText(/every 30 days, starting from the day this order is paid/i)).toBeInTheDocument()
  })

  it("clears the schedule with a null period when the box is unticked", async () => {
    const user = setupUser()
    const onChange = vi.fn().mockResolvedValue(undefined)
    render(<CartItemAutoOrder userProductId="up-42" value="TWO_WEEKS" onChange={onChange} />)

    expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).toBeChecked()
    expect(screen.getByRole("combobox", { name: FREQUENCY_TRIGGER })).toHaveTextContent("Every 15 days")

    await user.click(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX }))

    expect(onChange).toHaveBeenCalledWith("up-42", null)
    await waitFor(() => {
      expect(screen.queryByRole("combobox", { name: FREQUENCY_TRIGGER })).not.toBeInTheDocument()
    })
  })

  it("sends the newly picked period through the same handler", async () => {
    const user = setupUser()
    const onChange = vi.fn().mockResolvedValue(undefined)
    render(<CartItemAutoOrder userProductId="up-7" value="ONE_MONTH" onChange={onChange} />)

    await user.click(screen.getByRole("combobox", { name: FREQUENCY_TRIGGER }))
    await user.click(await screen.findByRole("option", { name: "Every 60 days" }))

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("up-7", "TWO_MONTHS")
    })
    expect(await screen.findByText(/every 60 days, starting from the day this order is paid/i)).toBeInTheDocument()
  })

  it("restores the previous selection when the write is rejected", async () => {
    const user = setupUser()
    const onChange = vi.fn().mockRejectedValue(new Error("save failed"))
    render(<CartItemAutoOrder userProductId="up-1" value={null} onChange={onChange} />)

    await user.click(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX }))

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).not.toBeChecked()
    })
    expect(screen.queryByRole("combobox", { name: FREQUENCY_TRIGGER })).not.toBeInTheDocument()
  })

  it("re-enables the control once a rejected write settles", async () => {
    const user = setupUser()
    const onChange = vi.fn().mockRejectedValue(new Error("save failed"))
    render(<CartItemAutoOrder userProductId="up-1" value={null} onChange={onChange} />)

    await user.click(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX }))

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).toBeEnabled()
    })
  })

  it("locks the controls while the parent reports the line as unavailable", () => {
    render(<CartItemAutoOrder userProductId="up-1" value="ONE_MONTH" onChange={vi.fn()} disabled />)

    expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: FREQUENCY_TRIGGER })).toBeDisabled()
  })

  it("adopts a schedule that arrived from a cart refetch", async () => {
    const { rerender } = render(<CartItemAutoOrder userProductId="up-1" value={null} onChange={vi.fn()} />)

    expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).not.toBeChecked()

    rerender(<CartItemAutoOrder userProductId="up-1" value="TWO_MONTHS" onChange={vi.fn()} />)

    expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).toBeChecked()
    expect(await screen.findByRole("combobox", { name: FREQUENCY_TRIGGER })).toHaveTextContent("Every 60 days")
  })

  it("re-ticking the box restores the period the item already had, not the default", async () => {
    const user = setupUser()
    const onChange = vi.fn().mockResolvedValue(undefined)
    render(<CartItemAutoOrder userProductId="up-1" value="TWO_WEEKS" onChange={onChange} />)

    await user.click(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX }))
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX })).not.toBeChecked()
    })
    await user.click(screen.getByRole("checkbox", { name: AUTO_ORDER_CHECKBOX }))

    expect(onChange).toHaveBeenNthCalledWith(1, "up-1", null)
    expect(onChange).toHaveBeenNthCalledWith(2, "up-1", "TWO_WEEKS")
  })
})
