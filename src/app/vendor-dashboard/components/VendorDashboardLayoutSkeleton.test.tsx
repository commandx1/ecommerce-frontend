import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import VendorDashboardLayoutSkeleton from "./VendorDashboardLayoutSkeleton"

describe("VendorDashboardLayoutSkeleton", () => {
  it("exposes a single page-level h1 while auth/hydration is still resolving", () => {
    render(<VendorDashboardLayoutSkeleton />)

    // Regression guard for the a11y-smoke FINDING "expected exactly 1 <h1> on
    // /vendor-dashboard, found 0": VendorDashboardLayout renders this
    // skeleton (isChecking === true, ~100ms) before DashboardHeader's h1
    // mounts, so it must carry its own (sr-only) h1 or the page has zero
    // headings until the auth check settles.
    expect(screen.getByRole("heading", { level: 1, name: "Loading Vendor Dashboard" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })
})
