import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { HelpCenterPage } from "./pages/help-center.page"
import { LegalPage } from "./pages/legal.page"

/**
 * Faz 8.2 - /help-center (ContactForm + TicketSubmissionForm) and /legal
 * (document navigation). Both help-center forms are entirely client-side
 * (useContactForm.ts / useTicketForm.ts only validate + `showToast`, no
 * backend request), and /legal is SSR'd from `?doc=` with content from
 * src/data/legal-*.json - no apiMock registration is needed for either page,
 * `registerAllMocks(apiMock)` is called only so the strict fixture's
 * teardown assertion has something registered if a shared layout ever fires
 * a background request (e.g. cart badge count).
 *
 * FINDING: validation on both forms is split across two mechanisms that
 * don't line up with `REQUIRED_FIELDS` in useContactForm.ts / useTicketForm.ts:
 *  - TextField / the ticket description textarea forward `required` to a
 *    REAL native input/textarea, and neither `<form>` sets `noValidate` -
 *    so the BROWSER's native constraint validation blocks submission (and
 *    `handleSubmit` never runs) before the custom validator ever sees an
 *    empty native field.
 *  - SelectField (Subject on the contact form; Priority/Category on the
 *    ticket form) is a Radix `<Select>` with no underlying native `<select>`
 *    (confirmed: node_modules/@radix-ui/react-select has no "BubbleSelect"/
 *    hidden-select for form participation in the installed version) - so a
 *    required-but-empty Select imposes NO native constraint at all. The
 *    ONLY thing that catches an empty required Select is the custom
 *    `REQUIRED_FIELDS` check.
 *  Net effect: an all-empty submit never reaches the custom "Missing
 *  details" toast (native validation stops it at the first empty required
 *  text field first). The custom toast IS reachable, but only via a
 *  form that satisfies every native-required text/textarea field while
 *  leaving a required Select untouched - that's what "empty submission" is
 *  tested as below, since it's the only way to observe useContactForm.ts /
 *  useTicketForm.ts's own validation branch through the UI.
 */

test.describe("help center forms", () => {
  test("submitting the contact form with the Subject left unselected shows the custom validation toast", async ({
    buyerPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)
    const helpCenter = new HelpCenterPage(buyerPage)
    await helpCenter.goto()

    // Every native-required field is filled; Subject (a Radix Select with no
    // native constraint of its own) is deliberately left untouched.
    await helpCenter.contactFirstName.fill("Jane")
    await helpCenter.contactLastName.fill("Doe")
    await helpCenter.contactEmail.fill("jane.doe@example.com")
    await helpCenter.contactMessage.fill("I need help updating my account details.")

    await helpCenter.contactSubmitButton.click()

    await expect(helpCenter.toast).toContainText("Missing details")
    // Nothing was cleared - the toast is a pure validation stop, not a submit.
    await expect(helpCenter.contactFirstName).toHaveValue("Jane")
  })

  test("submitting a fully filled contact form succeeds and resets the form", async ({ buyerPage, apiMock }) => {
    registerAllMocks(apiMock)
    const helpCenter = new HelpCenterPage(buyerPage)
    await helpCenter.goto()

    await helpCenter.contactFirstName.fill("Jane")
    await helpCenter.contactLastName.fill("Doe")
    await helpCenter.contactEmail.fill("jane.doe@example.com")
    await helpCenter.contactSubject.click()
    await buyerPage.getByRole("option", { name: "Account Support" }).click()
    await helpCenter.contactMessage.fill("I need help updating my account details.")

    await helpCenter.contactSubmitButton.click()

    await expect(helpCenter.toast).toContainText("Message sent")
    await expect(helpCenter.contactFirstName).toHaveValue("")
    await expect(helpCenter.contactMessage).toHaveValue("")
  })

  test("submitting the ticket form with Priority/Category left unselected shows the custom validation toast", async ({
    buyerPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)
    const helpCenter = new HelpCenterPage(buyerPage)
    await helpCenter.goto()

    // Title/Description are native-required and filled; Priority/Category
    // (Radix Selects, no native constraint) are left untouched.
    await helpCenter.ticketTitle.fill("Order arrived damaged")
    await helpCenter.ticketDescription.fill("The mixing tips arrived with a crushed box, contents look unusable.")

    await helpCenter.ticketSubmitButton.click()

    await expect(helpCenter.toast).toContainText("Missing details")
    await expect(helpCenter.ticketTitle).toHaveValue("Order arrived damaged")
  })

  test("submitting a fully filled ticket form succeeds and resets the form", async ({ buyerPage, apiMock }) => {
    registerAllMocks(apiMock)
    const helpCenter = new HelpCenterPage(buyerPage)
    await helpCenter.goto()

    await helpCenter.ticketPriority.click()
    await buyerPage.getByRole("option", { name: "High - Business impacting" }).click()
    await helpCenter.ticketCategory.click()
    await buyerPage.getByRole("option", { name: "Order Issues" }).click()
    await helpCenter.ticketTitle.fill("Order arrived damaged")
    await helpCenter.ticketDescription.fill("The mixing tips arrived with a crushed box, contents look unusable.")

    await helpCenter.ticketSubmitButton.click()

    await expect(helpCenter.toast).toContainText("Ticket submitted")
    await expect(helpCenter.ticketTitle).toHaveValue("")
    await expect(helpCenter.ticketDescription).toHaveValue("")
  })
})

test.describe("legal document navigation", () => {
  test("defaults to Terms of Service and highlights it in the sidebar", async ({ guestPage, apiMock }) => {
    registerAllMocks(apiMock)
    const legal = new LegalPage(guestPage)
    await legal.goto()

    await expect(legal.documentHeading).toHaveText("Terms of Service")
    await legal.expectUrl(/\/legal$/)
  })

  test("navigating to Privacy Policy via the sidebar updates the URL and the document", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)
    const legal = new LegalPage(guestPage)
    await legal.goto()

    await legal.sidebarLink("Privacy Policy").click()

    await legal.expectUrl(/\?doc=privacy-policy/)
    await expect(legal.documentHeading).toHaveText("Privacy Policy")
  })

  test("navigating between two documents (Privacy Policy -> HIPAA Compliance) updates each time", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)
    const legal = new LegalPage(guestPage)
    await legal.gotoDoc("privacy-policy")
    await expect(legal.documentHeading).toHaveText("Privacy Policy")

    await legal.sidebarLink("HIPAA Compliance").click()

    await legal.expectUrl(/\?doc=hipaa-compliance/)
    await expect(legal.documentHeading).toHaveText("HIPAA Compliance Notice")
  })

  test("an unknown ?doc= value falls back to the default document", async ({ guestPage, apiMock }) => {
    registerAllMocks(apiMock)
    const legal = new LegalPage(guestPage)
    await legal.gotoDoc("not-a-real-document")

    await expect(legal.documentHeading).toHaveText("Terms of Service")
  })
})
