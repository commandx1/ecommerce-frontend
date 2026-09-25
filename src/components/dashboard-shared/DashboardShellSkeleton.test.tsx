import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import DashboardShellSkeleton from "./DashboardShellSkeleton"

describe("DashboardShellSkeleton", () => {
  it("exposes a single sr-only h1 with the given heading text", () => {
    render(
      <DashboardShellSkeleton heading="Buyer Dashboard" navCount={5} brandClassName="h-7 w-44 rounded-md">
        <p>body placeholder</p>
      </DashboardShellSkeleton>,
    )

    expect(screen.getByRole("heading", { level: 1, name: "Buyer Dashboard" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("renders exactly navCount nav-dot placeholders in the sidebar", () => {
    const { container } = render(
      <DashboardShellSkeleton heading="Vendor Dashboard" navCount={6} brandClassName="h-8 w-48 rounded-md">
        <p>body placeholder</p>
      </DashboardShellSkeleton>,
    )

    const aside = container.querySelector("aside")
    expect(aside?.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6)
  })

  it("renders children inside main, with mainClassName applied", () => {
    render(
      <DashboardShellSkeleton
        heading="Buyer Dashboard"
        navCount={5}
        brandClassName="h-7 w-44 rounded-md"
        mainClassName="p-6"
      >
        <p>body placeholder</p>
      </DashboardShellSkeleton>,
    )

    expect(screen.getByText("body placeholder")).toBeInTheDocument()
    expect(screen.getByText("body placeholder").closest("main")).toHaveClass("flex-1", "p-6")
  })

  it("carries the shared backdrop and header chrome classes", () => {
    const { container } = render(
      <DashboardShellSkeleton heading="Buyer Dashboard" navCount={5} brandClassName="h-7 w-44 rounded-md">
        <p>body placeholder</p>
      </DashboardShellSkeleton>,
    )

    expect(container.querySelector('[data-theme-scope="dashboard"]')).toHaveClass(
      "relative",
      "isolate",
      "flex",
      "min-h-screen",
      "flex-col",
    )
    expect(container.querySelector(".dashboard-backdrop")).toBeInTheDocument()
    expect(container.querySelector("header")).toHaveClass("h-16", "glass-strip", "px-6")
  })
})
