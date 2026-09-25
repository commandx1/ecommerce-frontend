import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerOrderStatusTab } from "../types"
import OrdersStatusTabs from "./orders-status-tabs"

const mockUseBuyerOrdersTabsState = vi.fn()
const mockUseBuyerOrdersTabsActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersTabsState: () => mockUseBuyerOrdersTabsState(),
  useBuyerOrdersTabsActions: () => mockUseBuyerOrdersTabsActions(),
}))

const ALL_TABS: BuyerOrderStatusTab[] = ["All", "Pending", "Shipped", "Delivered", "Cancelled", "Returned"]

beforeEach(() => {
  vi.restoreAllMocks()
  mockUseBuyerOrdersTabsState.mockReset()
  mockUseBuyerOrdersTabsActions.mockReset()
})

describe("OrdersStatusTabs — rendering", () => {
  it("renders all six status tabs in order", () => {
    mockUseBuyerOrdersTabsState.mockReturnValue({ selectedTab: "All" })
    mockUseBuyerOrdersTabsActions.mockReturnValue({ handleTabChange: vi.fn() })

    render(<OrdersStatusTabs />)

    const buttons = screen.getAllByRole("button")
    expect(buttons.map((button) => button.textContent)).toEqual(ALL_TABS)
  })

  it.each(ALL_TABS)("marks '%s' as the active tab via aria-pressed when selected", (tab) => {
    mockUseBuyerOrdersTabsState.mockReturnValue({ selectedTab: tab })
    mockUseBuyerOrdersTabsActions.mockReturnValue({ handleTabChange: vi.fn() })

    render(<OrdersStatusTabs />)

    expect(screen.getByRole("button", { name: tab })).toHaveAttribute("aria-pressed", "true")
    for (const other of ALL_TABS.filter((candidate) => candidate !== tab)) {
      expect(screen.getByRole("button", { name: other })).toHaveAttribute("aria-pressed", "false")
    }
  })
})

describe("OrdersStatusTabs — tab click interaction", () => {
  it.each(ALL_TABS)("calls handleTabChange with '%s' when that tab is clicked", async (tab) => {
    const user = userEvent.setup()
    const handleTabChange = vi.fn()
    mockUseBuyerOrdersTabsState.mockReturnValue({ selectedTab: "All" })
    mockUseBuyerOrdersTabsActions.mockReturnValue({ handleTabChange })

    render(<OrdersStatusTabs />)
    await user.click(screen.getByRole("button", { name: tab }))

    expect(handleTabChange).toHaveBeenCalledTimes(1)
    expect(handleTabChange).toHaveBeenCalledWith(tab)
  })

  it("does not call handleTabChange just by rendering", () => {
    const handleTabChange = vi.fn()
    mockUseBuyerOrdersTabsState.mockReturnValue({ selectedTab: "Pending" })
    mockUseBuyerOrdersTabsActions.mockReturnValue({ handleTabChange })

    render(<OrdersStatusTabs />)

    expect(handleTabChange).not.toHaveBeenCalled()
  })
})
