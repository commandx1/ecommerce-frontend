import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import OrderConfirmationAutoOrderNotice from "./OrderConfirmationAutoOrderNotice"

describe("OrderConfirmationAutoOrderNotice", () => {
  it("stays hidden when the order had no recurring items", () => {
    render(<OrderConfirmationAutoOrderNotice status="none" registeredCount={0} expectedCount={0} />)

    expect(screen.queryByRole("link", { name: "Auto Orders" })).not.toBeInTheDocument()
  })

  it("stays hidden when nothing was expected even if the status says otherwise", () => {
    render(<OrderConfirmationAutoOrderNotice status="pending" registeredCount={0} expectedCount={0} />)

    expect(screen.queryByText(/Setting up automatic reordering/)).not.toBeInTheDocument()
  })

  it("confirms the schedules once they exist", () => {
    render(<OrderConfirmationAutoOrderNotice status="ready" registeredCount={2} expectedCount={2} />)

    expect(screen.getByText("2 items will be reordered automatically.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Auto Orders" })).toBeInTheDocument()
  })

  it("uses the singular wording for a single item", () => {
    render(<OrderConfirmationAutoOrderNotice status="ready" registeredCount={1} expectedCount={1} />)

    expect(screen.getByText("1 item will be reordered automatically.")).toBeInTheDocument()
  })

  it("reassures the buyer while the payment webhook is still in flight", () => {
    render(<OrderConfirmationAutoOrderNotice status="pending" registeredCount={1} expectedCount={3} />)

    expect(screen.getByText("Setting up automatic reordering for 3 items…")).toBeInTheDocument()
    expect(screen.getByText(/\(1 of 3 ready\)/)).toBeInTheDocument()
    expect(screen.getByText(/You can leave this page/)).toBeInTheDocument()
  })

  it("omits the progress count before anything has registered", () => {
    render(<OrderConfirmationAutoOrderNotice status="pending" registeredCount={0} expectedCount={3} />)

    expect(screen.queryByText(/of 3 ready/)).not.toBeInTheDocument()
  })

  it("tells the buyer where to look when the wait times out", () => {
    render(<OrderConfirmationAutoOrderNotice status="timeout" registeredCount={0} expectedCount={2} />)

    expect(screen.getByText(/still being set up for automatic reordering/)).toBeInTheDocument()
    expect(screen.getByText(/contact\s+support/)).toBeInTheDocument()
  })
})
