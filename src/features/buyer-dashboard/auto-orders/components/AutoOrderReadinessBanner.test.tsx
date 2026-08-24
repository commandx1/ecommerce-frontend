import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import type { AutoOrderReadiness } from "../hooks/useAutoOrders"
import AutoOrderReadinessBanner from "./AutoOrderReadinessBanner"

const readiness = (overrides: Partial<AutoOrderReadiness> = {}): AutoOrderReadiness => ({
  isLoading: false,
  hasPrimaryAddress: true,
  hasAutoOrderCard: true,
  isReady: true,
  ...overrides,
})

describe("AutoOrderReadinessBanner", () => {
  it("stays hidden while readiness is still being resolved", () => {
    render(<AutoOrderReadinessBanner readiness={readiness({ isLoading: true, isReady: false })} />)

    expect(screen.queryByText("Your auto orders can't run yet")).not.toBeInTheDocument()
  })

  it("stays hidden once the buyer has both a primary address and an auto order card", () => {
    render(<AutoOrderReadinessBanner readiness={readiness()} />)

    expect(screen.queryByText("Your auto orders can't run yet")).not.toBeInTheDocument()
  })

  it("links to payment methods when no auto order card is set", () => {
    render(<AutoOrderReadinessBanner readiness={readiness({ hasAutoOrderCard: false, isReady: false })} />)

    expect(screen.getByText("Your auto orders can't run yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Choose a card for auto orders" })).toHaveAttribute(
      "href",
      "/buyer-dashboard/payment-methods",
    )
    expect(screen.queryByRole("link", { name: "Set a primary address" })).not.toBeInTheDocument()
  })

  it("links to the address book when no primary address is set", () => {
    render(<AutoOrderReadinessBanner readiness={readiness({ hasPrimaryAddress: false, isReady: false })} />)

    expect(screen.getByRole("link", { name: "Set a primary address" })).toHaveAttribute(
      "href",
      "/buyer-dashboard/settings/addresses",
    )
    expect(screen.queryByRole("link", { name: "Choose a card for auto orders" })).not.toBeInTheDocument()
  })

  it("lists both blockers when neither prerequisite is met", () => {
    render(
      <AutoOrderReadinessBanner
        readiness={readiness({ hasPrimaryAddress: false, hasAutoOrderCard: false, isReady: false })}
      />,
    )

    expect(screen.getByRole("link", { name: "Choose a card for auto orders" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Set a primary address" })).toBeInTheDocument()
  })
})
