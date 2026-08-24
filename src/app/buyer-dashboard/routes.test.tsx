import { describe, expect, it, vi } from "vitest"
import { redirectMock } from "@/test/mocks/next-navigation"
import { render, screen } from "@/test/render"

/**
 * The buyer dashboard route files are thin shells: they either delegate to a feature
 * component or redirect a legacy URL. These tests pin down which is which — a silently
 * broken redirect would strand the buyer on a blank page.
 */

vi.mock("@/features/buyer-dashboard/auto-orders/BuyerAutoOrdersPage", () => ({
  default: () => <div data-testid="auto-orders-page" />,
}))
vi.mock("@/features/buyer-dashboard/invoices/BuyerInvoicesPage", () => ({
  default: () => <div data-testid="invoices-page" />,
}))
vi.mock("@/features/buyer-dashboard/payment-methods/BuyerPaymentMethodsPage", () => ({
  default: () => <div data-testid="payment-methods-page" />,
}))
vi.mock("@/features/suppliers/FavoriteSuppliersPage", () => ({
  default: () => <div data-testid="favorite-suppliers-page" />,
}))
vi.mock("@/components/dashboard-shared/AccountSettingsShared", () => ({
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="account-settings">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))
vi.mock("@/components/dashboard-shared/AddressManagementShared", () => ({
  default: () => <div data-testid="address-management" />,
}))

describe("buyer dashboard routes", () => {
  it("renders the auto orders feature at /buyer-dashboard/auto-orders", async () => {
    const { default: Page } = await import("./auto-orders/page")
    render(<Page />)

    expect(screen.getByTestId("auto-orders-page")).toBeInTheDocument()
  })

  it("renders the invoices feature at /buyer-dashboard/invoices", async () => {
    const { default: Page } = await import("./invoices/page")
    render(<Page />)

    expect(screen.getByTestId("invoices-page")).toBeInTheDocument()
  })

  it("renders the payment methods feature at /buyer-dashboard/payment-methods", async () => {
    const { default: Page } = await import("./payment-methods/page")
    render(<Page />)

    expect(screen.getByTestId("payment-methods-page")).toBeInTheDocument()
  })

  it("renders the favourite vendors feature at /buyer-dashboard/vendors/favorites", async () => {
    const { default: Page } = await import("./vendors/favorites/page")
    render(<Page />)

    expect(screen.getByTestId("favorite-suppliers-page")).toBeInTheDocument()
  })

  it("passes buyer-facing copy into the shared settings screen", async () => {
    const { default: Page } = await import("./settings/page")
    render(<Page />)

    expect(screen.getByRole("heading", { name: "Account Settings" })).toBeInTheDocument()
    expect(screen.getByText("Manage your professional profile and security preferences.")).toBeInTheDocument()
  })

  it("renders the shared address manager at /buyer-dashboard/settings/addresses", async () => {
    const { default: Page } = await import("./settings/addresses/page")
    render(<Page />)

    expect(screen.getByTestId("address-management")).toBeInTheDocument()
  })

  it.each([
    ["./suppliers/page", "/buyer-dashboard/vendors/favorites"],
    ["./suppliers/favorites/page", "/buyer-dashboard/vendors/favorites"],
    ["./vendors/page", "/buyer-dashboard/vendors/favorites"],
  ])("redirects the legacy route %s", async (modulePath, target) => {
    const { default: Page } = await import(modulePath)

    expect(() => Page()).toThrow(/NEXT_REDIRECT/)
    expect(redirectMock).toHaveBeenCalledWith(target)
  })
})
