import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { AccountSettingsPage } from "./pages/vendor-settings.page"

/**
 * `/vendor-dashboard/settings` - `AccountSettingsShared` + `CompanyInfoCard` +
 * `AddressManagementShared` (embedded). F68/F106: `PUT /users/me` has no `email` field and
 * `POST/PUT /address` has no `state` field - both were silently dropped by the backend while
 * the frontend reported success. These specs assert the OUTGOING request body directly so a
 * regression (a stray `email`/`state` key creeping back in) fails loudly instead of passing
 * because the mock echoes back a plausible-looking 200.
 */
test.describe("vendor settings", () => {
  test("updates personal information via PUT /users/me without an email field", async ({ vendorPage, apiMock }) => {
    registerAllMocks(apiMock)

    const page = new AccountSettingsPage(vendorPage)
    await page.goto()

    await expect(page.firstNameInput).toBeVisible()
    await page.firstNameInput.fill("Jordan")
    await page.lastNameInput.fill("Rivera")
    await page.phoneInput.fill("+15559876543")

    const putRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PUT" && req.url().includes("/backend-api/users/me"),
    )
    await page.saveProfileButton.click()
    const request = await putRequest
    const body = request.postDataJSON()

    expect(body).not.toHaveProperty("email")
    expect(body).toEqual({
      name: "Jordan",
      surname: "Rivera",
      phoneNumber: "+15559876543",
      twoFactorEnabled: false,
    })

    await expect(page.toast).toContainText("Profile updated successfully")
  })

  test("email field is read-only with an explanation, not an editable dead end", async ({ vendorPage, apiMock }) => {
    registerAllMocks(apiMock)

    const page = new AccountSettingsPage(vendorPage)
    await page.goto()

    await expect(page.emailInput).toBeVisible()
    await expect(page.emailInput).toBeDisabled()
    await expect(page.emailReadonlyNote).toBeVisible()
  })

  test("shows a readable error when saving personal information fails, not the raw backend response", async ({
    vendorPage,
    apiMock,
  }) => {
    apiMock.on("PUT", "/backend-api/users/me", () => ({
      status: 500,
      body: { message: 'relation "users" does not exist' },
    }))
    registerAllMocks(apiMock)

    const page = new AccountSettingsPage(vendorPage)
    await page.goto()

    await page.saveProfileButton.click()

    await expect(page.toast).toContainText("Failed to update profile. Please try again.")
    await expect(page.toast).not.toContainText("relation")
  })

  test("updates company information via PUT /companies/me with only the fields the backend accepts", async ({
    vendorPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    const page = new AccountSettingsPage(vendorPage)
    await page.goto()

    await expect(page.companyNameInput).toBeVisible()
    await page.companyNameInput.fill("Acme Dental Supplies Co.")

    const putRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PUT" && req.url().includes("/backend-api/companies/me"),
    )
    await page.saveCompanyButton.click()
    const request = await putRequest
    const body = request.postDataJSON()

    expect(Object.keys(body).sort()).toEqual(
      ["name", "companyPhoto", "taxNumber", "email", "phoneNumber", "website", "description", "uberEnabled"].sort(),
    )
    expect(body.name).toBe("Acme Dental Supplies Co.")

    await expect(page.toast).toContainText("Company information updated successfully")
  })

  test("adds a new address via Google Places selection - POST /backend-api/address has no state field", async ({
    vendorPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/api/google-maps/autocomplete", () => ({
      body: {
        predictions: [
          {
            place_id: "gplace-1",
            description: "500 Market St, San Francisco, CA, USA",
            structured_formatting: { main_text: "500 Market St", secondary_text: "San Francisco, CA, USA" },
          },
        ],
      },
    }))
    apiMock.on("GET", "/api/google-maps/place-details", () => ({
      body: {
        result: {
          place_id: "gplace-1",
          formatted_address: "500 Market St, San Francisco, CA 94105, USA",
          geometry: { location: { lat: 37.7912, lng: -122.3971 } },
          address_components: [
            { long_name: "500", short_name: "500", types: ["street_number"] },
            { long_name: "Market Street", short_name: "Market St", types: ["route"] },
            { long_name: "San Francisco", short_name: "SF", types: ["locality"] },
            { long_name: "California", short_name: "CA", types: ["administrative_area_level_1"] },
            { long_name: "United States", short_name: "US", types: ["country"] },
            { long_name: "94105", short_name: "94105", types: ["postal_code"] },
          ],
        },
      },
    }))
    registerAllMocks(apiMock)

    const page = new AccountSettingsPage(vendorPage)
    await page.goto()

    await expect(page.addNewAddressButton).toBeVisible()
    await page.addNewAddressButton.click()

    await page.addressTitleInput.fill("Warehouse")
    await page.addressSearchInput.fill("500 Market")
    await expect(page.addressSuggestion("500 Market St, San Francisco, CA, USA")).toBeVisible()
    await page.addressSuggestion("500 Market St, San Francisco, CA, USA").click()

    await expect(page.saveAddressButton).toBeEnabled()

    const postRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/backend-api/address"),
    )
    await page.saveAddressButton.click()
    const request = await postRequest
    const body = request.postDataJSON()

    expect(body).not.toHaveProperty("state")
    expect(body.title).toBe("Warehouse")
    expect(body.postalCode).toBe("94105")
    expect(body.placeId).toBe("gplace-1")

    await expect(page.toast).toContainText("New address added")
  })

  test("updates an existing address via PUT /backend-api/address/:id - no state field in the body", async ({
    vendorPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    const page = new AccountSettingsPage(vendorPage)
    await page.goto()

    await expect(page.editAddressButton).toBeVisible()
    await page.editAddressButton.click()

    await page.addressZipInput.fill("10022")

    const putRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PUT" && req.url().includes("/backend-api/address/address-1"),
    )
    await page.saveAddressButton.click()
    const request = await putRequest
    const body = request.postDataJSON()

    expect(body).not.toHaveProperty("state")
    expect(body.postalCode).toBe("10022")

    await expect(page.toast).toContainText("Address updated")
  })
})
