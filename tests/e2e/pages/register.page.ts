import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** /register (RegisterPage -> RegisterForm), plain self-serve flow (no ?token=). */
export class RegisterPage extends BasePage {
  readonly path = "/register"

  get firstNameInput(): Locator {
    return this.page.getByLabel("First Name")
  }

  get lastNameInput(): Locator {
    return this.page.getByLabel("Last Name")
  }

  get emailInput(): Locator {
    return this.page.getByLabel("Email Address")
  }

  get phoneNumberInput(): Locator {
    return this.page.getByLabel("Phone Number")
  }

  get businessTypeSelect(): Locator {
    return this.page.getByRole("combobox", { name: "Business Type" })
  }

  get addressSearchInput(): Locator {
    return this.page.getByLabel(/Search Address/)
  }

  addressSuggestion(description: string): Locator {
    return this.page.getByRole("option", { name: description })
  }

  // FormField appends a trailing " *" to every required label (label + " " + "*"), so the real
  // accessible names are "Password *" and "Confirm Password *" - plain `getByLabel("Password")`
  // would substring-match both. Anchored regexes pick out exactly one each.
  get passwordInput(): Locator {
    return this.page.getByLabel(/^Password \*$/)
  }

  get confirmPasswordInput(): Locator {
    return this.page.getByLabel(/^Confirm Password \*$/)
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: /Create Account|Creating Account/ })
  }
}

/** /verify-email (VerifyEmailPage -> VerifyEmailContent), reached with `?email=` in the URL. */
export class VerifyEmailPage extends BasePage {
  readonly path = "/verify-email"

  get codeInput(): Locator {
    return this.page.getByLabel("Verification Code")
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: /Verify Email|Verifying|Redirecting/ })
  }

  get backToRegisterButton(): Locator {
    return this.page.getByRole("button", { name: "Back to registration" })
  }
}
