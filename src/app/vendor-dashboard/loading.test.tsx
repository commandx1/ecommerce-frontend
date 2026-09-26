import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import VendorDashboardLoading from "./loading"

// Thin wrapper around the shared DashboardContentSkeleton - its own a11y contract (h1 text,
// aria-busy, no header/aside) is covered by DashboardContentSkeleton.test.tsx; this only pins
// that the vendor-dashboard label is wired through correctly.
describe("VendorDashboardLoading", () => {
  it("renders the expected sr-only h1", () => {
    render(<VendorDashboardLoading />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Loading Vendor Dashboard Content")
  })
})
