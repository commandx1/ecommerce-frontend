import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { AccountSettingsPage, BuyerAddressesPage } from "./pages/vendor-settings.page"

/**
 * `/buyer-dashboard/settings` renders the same `AccountSettingsShared` component as the vendor
 * side, but composed differently: no `CompanyInfoCard`/`StripeConnectCard`/embedded
 * `AddressManagementShared` (isVendor is false), and `LicenseManagementCard` renders instead
 * (see AccountSettingsShared.tsx: `{!isVendor && <LicenseManagementCard />}`). Addresses live on
 * their own route (`/buyer-dashboard/settings/addresses`, see DashboardSidebar.tsx), not
 * embedded here. Account/address SAVE behaviour is already covered end-to-end in
 * vendor-settings.spec.ts against the identical shared components - this file only verifies the
 * buyer-side composition wires up correctly, per the task brief.
 *
 * `GET /backend-api/licenses` is NOT registered by account.mocks.ts (the handler wraps
 * `makeLicense()` in a `{ licenses, total }` literal with no exported factory - see that file's
 * header comment) - registered per-spec here, same pattern as buyer-payment-methods.spec.ts's
 * `GET /backend-api/cards`.
 */
test.describe("buyer settings composition", () => {
  test("loads account settings with the personal information and license sections", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/licenses", () => ({
      body: {
        licenses: [
          {
            id: "license-1",
            licenseType: "STATE_DENTAL",
            stateOfLicense: "NY",
            licenseNumber: "DDS-123456",
            year: 2024,
            month: 6,
            day: 15,
            approved: true,
            rejectDescription: null,
            expired: false,
            createdDate: "2026-01-01T00:00:00Z",
            updatedDate: "2026-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
    }))
    registerAllMocks(apiMock)

    const page = new AccountSettingsPage(buyerPage, "/buyer-dashboard/settings")
    await page.goto()

    await expect(page.mainHeading).toContainText("Account Settings")
    await expect(page.profileSection).toBeVisible()
    await expect(page.firstNameInput).toHaveValue("Serhat")
    await expect(page.emailInput).toBeDisabled()
    await expect(buyerPage.getByRole("heading", { name: "License Information" })).toBeVisible()

    // Buyer settings composes AccountSettingsShared WITHOUT the embedded address section -
    // addresses are a separate route (see file header comment).
    await expect(buyerPage.getByRole("heading", { name: "Addresses", exact: true })).toHaveCount(0)
  })

  test("addresses are managed on their own route, reusing the same shared component", async ({
    buyerPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    const page = new BuyerAddressesPage(buyerPage)
    await page.goto()

    await expect(page.heading).toBeVisible()
    await expect(page.addNewAddressButton).toBeVisible()
    await expect(buyerPage.getByText("Home").first()).toBeVisible()
  })
})
