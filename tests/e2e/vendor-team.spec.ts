import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { VendorTeamPage } from "./pages/vendor-team.page"

/**
 * `/vendor-dashboard/team` - invite form backed by `POST /backend-api/mail/invite-company-user`
 * (src/lib/api/company.ts's `inviteCompanyUser`). Default mock `companyRole` is "OWNER"
 * (makeCompanyProfile), which is required for this page to render the invite form at all - see
 * `useCompanyRole()` gate in vendor-dashboard/team/page.tsx.
 */
test.describe("vendor team invites", () => {
  test("invites a MEMBER via POST /backend-api/mail/invite-company-user with the right body", async ({
    vendorPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    const page = new VendorTeamPage(vendorPage)
    await page.goto()

    await expect(page.emailInput).toBeVisible()
    await page.emailInput.fill("newmember@example.com")

    const postRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/backend-api/mail/invite-company-user"),
    )
    await page.sendInvitationButton.click()
    const request = await postRequest
    const body = request.postDataJSON()

    expect(body).toEqual({ email: "newmember@example.com", companyRole: "MEMBER" })
    await expect(page.toast).toContainText("Invitation sent")
  })

  test("invites a MANAGER via the role selector", async ({ vendorPage, apiMock }) => {
    registerAllMocks(apiMock)

    const page = new VendorTeamPage(vendorPage)
    await page.goto()

    await page.emailInput.fill("newmanager@example.com")
    await page.roleSelectTrigger.click()
    await page.roleOption("Manager").click()

    const postRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/backend-api/mail/invite-company-user"),
    )
    await page.sendInvitationButton.click()
    const request = await postRequest
    const body = request.postDataJSON()

    expect(body).toEqual({ email: "newmanager@example.com", companyRole: "MANAGER" })
    await expect(page.toast).toContainText("Invitation sent")
  })

  test("blocks submission for an empty email", async ({ vendorPage, apiMock }) => {
    let inviteCalled = false
    apiMock.on("POST", "/backend-api/mail/invite-company-user", () => {
      inviteCalled = true
      return { status: 200 }
    })
    registerAllMocks(apiMock)

    const page = new VendorTeamPage(vendorPage)
    await page.goto()

    await page.sendInvitationButton.click()

    await expect(page.fieldError("Email is required.")).toBeVisible()
    expect(inviteCalled).toBe(false)
  })

  test("blocks submission for an invalid email", async ({ vendorPage, apiMock }) => {
    let inviteCalled = false
    apiMock.on("POST", "/backend-api/mail/invite-company-user", () => {
      inviteCalled = true
      return { status: 200 }
    })
    registerAllMocks(apiMock)

    const page = new VendorTeamPage(vendorPage)
    await page.goto()

    // `<input type="email">` blocks the browser's own native constraint validation before
    // React's onSubmit even runs for a value with no "@" at all (e.g. "not-an-email"), so the
    // custom EMAIL_PATTERN message would never get a chance to render. "foo@bar" has an "@" and
    // no spaces (passes native validation) but no "." after the domain (fails EMAIL_PATTERN),
    // so it reaches the app's own check.
    await page.emailInput.fill("foo@bar")
    await page.sendInvitationButton.click()

    await expect(page.fieldError("Enter a valid email address.")).toBeVisible()
    expect(inviteCalled).toBe(false)
  })

  test("shows the backend's readable message when the invite fails", async ({ vendorPage, apiMock }) => {
    // F71: invite-company-user's real duplicate-invite rejection is a 400 with a flat message
    // body, not the 403/409 the pre-audit tests assumed - see TEST-FINDINGS.md F71.
    apiMock.on("POST", "/backend-api/mail/invite-company-user", () => ({
      status: 400,
      body: { message: "An invitation is already pending for this email." },
    }))
    registerAllMocks(apiMock)

    const page = new VendorTeamPage(vendorPage)
    await page.goto()

    await page.emailInput.fill("pending@example.com")
    await page.sendInvitationButton.click()

    await expect(page.toast).toContainText("An invitation is already pending for this email.")
  })
})
