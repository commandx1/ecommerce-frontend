import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Faz 8.2 - /help-center (src/app/help-center/page.tsx ->
 * src/features/help-center/HelpCenterPage.tsx). Both forms on this page
 * (ContactForm, TicketSubmissionForm) are entirely client-side - `handleSubmit`
 * only validates + shows a toast (see useContactForm.ts / useTicketForm.ts),
 * there is no backend request. Nothing to register in apiMock for this page.
 */
export class HelpCenterPage extends BasePage {
  readonly path = "/help-center"

  /**
   * FINDING: overrides BasePage's `toast` getter - the installed `sonner`
   * never renders `role="status"` (each toast is a plain
   * `<li data-sonner-toast>`), so `[data-sonner-toaster] [role='status']`
   * matches nothing. See buyer-auto-orders.page.ts's `toast` getter for the
   * full verification note.
   */
  get toast(): Locator {
    return this.page.locator("[data-sonner-toaster] li[data-sonner-toast]")
  }

  // -- Contact form (ContactFormSection) --

  get contactFirstName(): Locator {
    return this.page.getByLabel("First Name")
  }

  get contactLastName(): Locator {
    return this.page.getByLabel("Last Name")
  }

  get contactEmail(): Locator {
    return this.page.getByLabel("Email Address")
  }

  get contactSubject(): Locator {
    return this.page.getByLabel("Subject")
  }

  get contactMessage(): Locator {
    return this.page.getByLabel("Message")
  }

  get contactSubmitButton(): Locator {
    return this.page.getByRole("button", { name: "Send Message" })
  }

  // -- Ticket form (TicketSubmissionSection) --

  get ticketPriority(): Locator {
    return this.page.getByLabel("Ticket Priority")
  }

  get ticketCategory(): Locator {
    return this.page.getByLabel("Issue Category")
  }

  get ticketTitle(): Locator {
    return this.page.getByLabel("Ticket Title")
  }

  get ticketDescription(): Locator {
    return this.page.getByLabel("Detailed Description *")
  }

  get ticketSubmitButton(): Locator {
    return this.page.getByRole("button", { name: "Submit Ticket" })
  }
}
