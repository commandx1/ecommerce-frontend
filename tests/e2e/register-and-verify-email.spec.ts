import { expect, test } from "./fixtures/api-mock.fixture"
import { registerAllMocks } from "./mocks"
import { RegisterPage, VerifyEmailPage } from "./pages/register.page"

/**
 * Self-serve /register -> /verify-email journey (src/app/register, src/app/verify-email;
 * src/features/register, src/features/verify-email). There is no separate "vendor register"
 * page to also cover here - the only other entry point into these forms is the OWNER/TEAM_MEMBER
 * invite-token flow (?token=...), a distinct admin-invited signup that isn't reachable by a plain
 * visitor and is out of scope for this journey.
 *
 * Endpoints/DTOs, verified against ecommerce-api:
 *  - `POST /users/register` -> UserController#register, body is `UserCreateRequest` (name,
 *    surname, email, password, phoneNumber, businessDescribe, address). `address` deserializes
 *    into `AddressCreateRequest`, which has NO `state` field - register-payload.ts's
 *    `buildAddressPayload` doc-comment explains the selected state is sent in `city` instead
 *    (mirrors the same quirk vendor-settings.spec.ts documents for `POST /address`). Unlike that
 *    address-management flow, `buildAddressPayload` does NOT strip the original `state` key, so
 *    the wire body still carries a redundant `state` field alongside `city` - harmless (Jackson
 *    ignores unknown properties by default), so this test asserts it as real rather than assuming
 *    the same "no state field" wording applies to the wire body here too.
 *  - `POST /mail/verify-email` -> MailController#verifyEmail, body is `VerifyEmailRequest`
 *    (email, code).
 *  - `POST /api/auth/login` (Next route proxy, not `/backend-api`) - the autologin hop
 *    useVerifyEmailForm.ts makes right after a successful code, using the password
 *    verify-email-autologin.ts held in sessionStorage since registration.
 */
test.use({ viewport: { width: 1280, height: 900 } })

/** Minimal, syntactically-valid unsigned JWT with a numeric `exp` far in the future - mirrors
 * guest-add-to-cart.spec.ts's identical helper (isJwtExpired in client.ts only reads the payload). */
const buildJwt = (secondsFromNow: number): string => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: "jordan.rivera@example.com", exp })}.sig`
}

function registerGoogleMapsMocks(apiMock: import("./fixtures/api-mock.fixture").ApiMock) {
  // Same fixture shape as vendor-settings.spec.ts's "adds a new address via Google Places
  // selection" test - AddressAutocomplete (src/components/AddressAutocomplete.tsx) is the exact
  // same shared component in both places.
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
}

async function fillRegisterForm(page: import("@playwright/test").Page, register: RegisterPage) {
  await register.firstNameInput.fill("Jordan")
  await register.lastNameInput.fill("Rivera")
  await register.emailInput.fill("jordan.rivera@example.com")
  await register.phoneNumberInput.fill("5551234567")

  await register.businessTypeSelect.click()
  await page.getByRole("option", { name: "Dental Practice" }).click()

  await register.addressSearchInput.fill("500 Market")
  await expect(register.addressSuggestion("500 Market St, San Francisco, CA, USA")).toBeVisible()
  await register.addressSuggestion("500 Market St, San Francisco, CA, USA").click()

  await register.passwordInput.fill("StrongPass1!")
  await register.confirmPasswordInput.fill("StrongPass1!")
}

test.describe("register + verify email", () => {
  test.describe("happy path", () => {
    // Autologin lands on "/" at the end of this test - the home page's own (unrelated) request
    // surface (categories, featured products, etc. - already covered by browse-to-cart.spec.ts
    // and friends) isn't this journey's concern, so the strict "every request must be
    // registered" teardown check is relaxed for this one test only.
    test.use({ apiMockStrict: false })

    test("submits the register form, verifies the code, and auto-logs the shopper in", async ({ page, apiMock }) => {
      apiMock.on("POST", "/backend-api/users/register", () => ({
        status: 201,
        body: { id: "user-1", name: "Jordan", surname: "Rivera", emailConfirmed: false },
      }))
      registerGoogleMapsMocks(apiMock)
      apiMock.on("POST", "/backend-api/mail/verify-email", () => ({ status: 200 }))
      apiMock.on("POST", "/api/auth/login", () => ({
        body: {
          id: "user-1",
          name: "Jordan",
          surname: "Rivera",
          email: "jordan.rivera@example.com",
          phoneNumber: "5551234567",
          emailConfirmed: true,
          phoneNumberConfirmed: false,
          twoFactorEnabled: false,
          lockoutEnd: null,
          createdDate: "2026-01-01T00:00:00Z",
          roleName: "BUYER",
          accessToken: buildJwt(3600),
          refreshToken: "refresh-token-1",
        },
      }))
      registerAllMocks(apiMock)

      const register = new RegisterPage(page)
      await register.goto()
      await expect(page.getByRole("heading", { name: "Professional Registration" })).toBeVisible()

      await fillRegisterForm(page, register)

      const registerRequest = page.waitForRequest(
        (request) => request.method() === "POST" && request.url().endsWith("/backend-api/users/register"),
      )
      await register.submitButton.click()
      const request = await registerRequest
      const registerRequestBody = request.postDataJSON()

      expect(registerRequestBody).toMatchObject({
        name: "Jordan",
        surname: "Rivera",
        email: "jordan.rivera@example.com",
        password: "StrongPass1!",
        phoneNumber: "5551234567",
        businessDescribe: "Dental_Practice",
        address: {
          title: "Business",
          fullName: "Jordan Rivera",
          phoneNumber: "5551234567",
          country: "US",
          // AddressCreateRequest (backend DTO) has no `state` field - buildAddressPayload puts
          // the selected state (short_name "CA" from the mocked place details' administrative
          // area component) in `city` instead. It also still spreads the original `state` key
          // from form state into the payload alongside it (register-payload.ts doesn't strip
          // it) - a harmless extra field Spring's default Jackson config silently ignores since
          // AddressCreateRequest doesn't declare it, so this asserts it's present rather than
          // pretending the wire body omits it.
          city: "CA",
          state: "CA",
          postalCode: "94105",
          placeId: "gplace-1",
          formattedAddress: "500 Market St, San Francisco, CA 94105, USA",
          defaultAddress: true,
        },
      })
      expect(registerRequestBody).not.toHaveProperty("company")

      // Landed on /verify-email with the registered email.
      await expect(page).toHaveURL(/\/verify-email\?email=jordan\.rivera%40example\.com/)
      const verifyEmail = new VerifyEmailPage(page)
      await expect(page.getByRole("heading", { name: "Email Verification" })).toBeVisible()
      await expect(page.getByText("jordan.rivera@example.com")).toBeVisible()

      const verifyRequest = page.waitForRequest(
        (req) => req.method() === "POST" && req.url().endsWith("/backend-api/mail/verify-email"),
      )
      await verifyEmail.codeInput.fill("123456")
      await verifyEmail.submitButton.click()
      const verifyReq = await verifyRequest
      expect(verifyReq.postDataJSON()).toEqual({ email: "jordan.rivera@example.com", code: "123456" })

      // Autologin (useVerifyEmailForm.ts) -> lands on "/".
      await expect(page.getByText("You are now signed in.")).toBeVisible()
      await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
    })
  })

  test("shows an error and does not sign in on an invalid/expired code", async ({ page, apiMock }) => {
    apiMock.on("POST", "/backend-api/mail/verify-email", () => ({
      status: 400,
      body: { message: "This verification code is invalid or has expired." },
    }))
    registerAllMocks(apiMock)

    const verifyEmail = new VerifyEmailPage(page)
    await verifyEmail.goto({ email: "jordan.rivera@example.com" })
    await expect(page.getByRole("heading", { name: "Email Verification" })).toBeVisible()

    await verifyEmail.codeInput.fill("000000")
    await verifyEmail.submitButton.click()

    await expect(page.getByText("This verification code is invalid or has expired.")).toBeVisible()
    // Still on /verify-email - no autologin, no navigation away.
    await expect(page).toHaveURL(/\/verify-email/)
    await expect(verifyEmail.codeInput).toBeVisible()
  })
})
