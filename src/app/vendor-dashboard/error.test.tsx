import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import VendorDashboardError from "./error"

// Scoped to /vendor-dashboard/**, so it renders inside VendorDashboardLayout's <main> - the
// header/sidebar stay mounted around it. Same contract as app/error.test.tsx, but the recovery
// link points back at the dashboard root instead of "/".
describe("VendorDashboardError", () => {
  it("carries exactly one h1", () => {
    render(<VendorDashboardError error={new Error("boom")} reset={vi.fn()} />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Something went wrong")
  })

  it("offers a way out: retry and a link back to the vendor dashboard", async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(<VendorDashboardError error={new Error("boom")} reset={reset} />)

    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(reset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("link", { name: "Back to Dashboard" })).toHaveAttribute("href", "/vendor-dashboard")
  })

  it("surfaces the digest when there is one", () => {
    render(<VendorDashboardError error={Object.assign(new Error("boom"), { digest: "abc123" })} reset={vi.fn()} />)

    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it("never renders the raw message, which can leak internals to the visitor", () => {
    render(<VendorDashboardError error={new Error("connect ECONNREFUSED 127.0.0.1:4010")} reset={vi.fn()} />)

    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
  })
})
