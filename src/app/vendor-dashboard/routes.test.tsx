import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"

/**
 * The vendor dashboard's overview/analytics pages are pure compositions. Chart-heavy
 * children are stubbed so these tests assert the composition itself — which panels a
 * vendor lands on — rather than re-testing chart.js.
 */
const stub = (testId: string) => ({ default: () => <div data-testid={testId} /> })

vi.mock("./components/DashboardHeader", () => stub("vendor-dashboard-header"))
vi.mock("./components/VendorMetricsCards", () => stub("vendor-metrics"))
vi.mock("./components/RevenueChart", () => stub("revenue-chart"))
vi.mock("./components/TopSellingProducts", () => stub("top-selling-products"))
vi.mock("./components/VendorRecentOrders", () => stub("vendor-recent-orders"))
vi.mock("./components/InventoryStatus", () => stub("inventory-status"))
vi.mock("./components/GeographicDistribution", () => stub("geographic-distribution"))
vi.mock("./components/CustomerAnalyticsChart", () => stub("customer-analytics-chart"))
vi.mock("./components/MarketingPerformance", () => stub("marketing-performance"))
vi.mock("./components/VendorNotifications", () => stub("vendor-notifications"))
vi.mock("@/components/dashboard-shared/AccountSettingsShared", () => ({
  default: ({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  ),
}))
vi.mock("@/components/dashboard-shared/AddressManagementShared", () => ({
  default: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid={embedded ? "addresses-embedded" : "addresses"} />
  ),
}))

describe("vendor dashboard routes", () => {
  it("puts metrics, revenue and orders on the overview", async () => {
    const { default: Page } = await import("./page")
    render(<Page />)

    for (const testId of [
      "vendor-dashboard-header",
      "vendor-metrics",
      "revenue-chart",
      "top-selling-products",
      "vendor-recent-orders",
      "inventory-status",
      "geographic-distribution",
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })

  it("builds the analytics page from the revenue, customer and marketing panels", async () => {
    const { default: Page } = await import("./analytics/page")
    render(<Page />)

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument()
    expect(screen.getByTestId("customer-analytics-chart")).toBeInTheDocument()
    expect(screen.getByTestId("marketing-performance")).toBeInTheDocument()
    expect(screen.getByTestId("vendor-notifications")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Export Analytics/ })).toBeInTheDocument()
  })

  it("gives vendors their own settings copy and embeds the address manager", async () => {
    const { default: Page } = await import("./settings/page")
    render(<Page />)

    expect(screen.getByRole("heading", { name: "Vendor Settings" })).toBeInTheDocument()
    expect(screen.getByText("Manage your vendor profile and security preferences.")).toBeInTheDocument()
    expect(screen.getByTestId("addresses-embedded")).toBeInTheDocument()
  })
})
