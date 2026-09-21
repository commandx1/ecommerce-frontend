import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { AccountSettingsPage } from "./pages/vendor-settings.page"

/**
 * `/buyer-dashboard/settings` renders the same `AccountSettingsShared` component as the vendor
 * side, but composed differently: no `CompanyInfoCard`/`StripeConnectCard` (isVendor is false),
 * both pages embed `AddressManagementShared` the same way - a single address, heading "Address"
 * (see src/app/buyer-dashboard/settings/page.tsx and src/app/vendor-dashboard/settings/page.tsx)
 * - and the buyer page additionally renders `LicenseManagementSection` as its own card directly
 * below the address card (see AccountSettingsShared.tsx: `{!isVendor && <LicenseManagementSection
 * />}`, placed after the `children` block and before Security). Account/address SAVE behaviour is
 * already covered end-to-end in vendor-settings.spec.ts against the identical shared components -
 * this file only verifies the buyer-side composition wires up correctly, per the task brief.
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
    await expect(buyerPage.getByRole("heading", { name: "Professional Licenses", level: 2 })).toBeVisible()

    // AddressManagementShared's heading is the singular "Address" - the old plural "Addresses"
    // heading from the removed multi-address mode must not appear (see file header comment).
    await expect(buyerPage.getByRole("heading", { name: "Addresses", exact: true })).toHaveCount(0)
  })
})
