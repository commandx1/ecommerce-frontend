import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import DashboardShellFrame from "./DashboardShellFrame"

describe("DashboardShellFrame", () => {
  it("renders the header and sidebar slots plus children inside main, with the shared chrome classes", () => {
    render(
      <DashboardShellFrame header={<div data-testid="header-slot">Header</div>} sidebar={<nav>Sidebar</nav>}>
        <p>Body</p>
      </DashboardShellFrame>,
    )

    expect(screen.getByTestId("header-slot")).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toHaveTextContent("Sidebar")
    const main = screen.getByRole("main")
    expect(main).toHaveTextContent("Body")
    expect(main).toHaveClass("min-w-0", "flex-1", "p-4", "md:p-6")

    const frame = main.closest('[data-theme-scope="dashboard"]')
    expect(frame).toHaveClass("relative", "isolate", "flex", "min-h-screen", "flex-col")
    expect(frame?.querySelector(".dashboard-backdrop")).toBeInTheDocument()
  })

  it("merges an extra mainClassName onto the base main classes (buyer's overflow-auto)", () => {
    render(
      <DashboardShellFrame header={<div />} sidebar={<div />} mainClassName="overflow-auto">
        <p>Body</p>
      </DashboardShellFrame>,
    )

    expect(screen.getByRole("main")).toHaveClass("min-w-0", "flex-1", "p-4", "md:p-6", "overflow-auto")
  })

  it("gives main a stable, non-empty id", () => {
    render(
      <DashboardShellFrame header={<div />} sidebar={<div />}>
        <p>Body</p>
      </DashboardShellFrame>,
    )

    expect(screen.getByRole("main").id).toBeTruthy()
  })
})
