import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import BuyerDashboardLayoutSkeleton from "./BuyerDashboardLayoutSkeleton"

describe("BuyerDashboardLayoutSkeleton", () => {
  it("exposes a single page-level h1 while auth/hydration is still resolving", () => {
    render(<BuyerDashboardLayoutSkeleton />)

    // Regression guard for the a11y-smoke FINDING "expected exactly 1 <h1> on
    // /buyer-dashboard, found 0": BuyerDashboardLayout renders this skeleton
    // (isChecking === true, ~100ms) before WelcomeSection's h1 mounts, so it
    // must carry its own (sr-only) h1 or the page has zero headings until
    // the auth check settles.
    expect(screen.getByRole("heading", { level: 1, name: "Buyer Dashboard" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })
})
