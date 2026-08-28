import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Vendor team invite page (`/vendor-dashboard/team`). */
export class VendorTeamPage extends BasePage {
  readonly path = "/vendor-dashboard/team"

  get emailInput(): Locator {
    return this.page.getByLabel("Email address")
  }

  /** Radix `Select` trigger - `<Label htmlFor>` associates it with the accessible name "Role". */
  get roleSelectTrigger(): Locator {
    return this.page.getByRole("combobox", { name: "Role" })
  }

  roleOption(label: "Manager" | "Member"): Locator {
    return this.page.getByRole("option", { name: label })
  }

  get sendInvitationButton(): Locator {
    return this.page.getByRole("button", { name: "Send invitation" })
  }

  fieldError(message: string): Locator {
    return this.page.getByText(message, { exact: true })
  }
}
