import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import BuyerDashboardLoading from "./loading"

// Thin wrapper around the shared DashboardContentSkeleton - its own a11y contract (h1 text,
// aria-busy, no header/aside) is covered by DashboardContentSkeleton.test.tsx; this only pins
// that the buyer-dashboard label is wired through correctly.
describe("BuyerDashboardLoading", () => {
  it("renders the expected sr-only h1", () => {
    render(<BuyerDashboardLoading />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Loading Buyer Dashboard Content")
  })
})
