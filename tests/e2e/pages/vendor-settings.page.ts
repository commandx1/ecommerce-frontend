import type { Locator, Page } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * `AccountSettingsShared` (src/components/dashboard-shared/AccountSettingsShared.tsx) backs
 * both `/vendor-dashboard/settings` and `/buyer-dashboard/settings` - only the embedded
 * children differ per role (vendor gets `CompanyInfoCard` + `StripeConnectCard` +
 * `AddressManagementShared embedded`; buyer gets neither). One page object models the shared
 * markup, with `path` injected so both dashboards can reuse it instead of duplicating
 * near-identical locators in a second page object.
 */
export class AccountSettingsPage extends BasePage {
  readonly path: string

  constructor(page: Page, path = "/vendor-dashboard/settings") {
    super(page)
    this.path = path
  }

  /**
   * Scopes locators to the `<section>` under a given heading. Needed because "Personal
   * Information" and "Company Information" both render a button named "Save Changes", and the
   * embedded address form's "Phone Number"/"Full Name" labels would otherwise collide with the
   * profile form's - see AccountSettingsShared.tsx / AddressManagementShared.tsx.
   */
  private sectionByHeading(name: string): Locator {
    return this.page.getByRole("heading", { name, exact: true }).locator("xpath=ancestor::section[1]")
  }

  get profileSection(): Locator {
    return this.sectionByHeading("Personal Information")
  }

  get firstNameInput(): Locator {
    return this.profileSection.getByLabel("First Name")
  }

  get lastNameInput(): Locator {
    return this.profileSection.getByLabel("Last Name")
  }

  get emailInput(): Locator {
    return this.profileSection.getByLabel("Email Address")
  }

  /** F68/F106: `PUT /users/me` has no `email` field - the field is read-only on purpose. */
  get emailReadonlyNote(): Locator {
    return this.profileSection.getByText("Your email address can't be changed here.")
  }

  get phoneInput(): Locator {
    return this.profileSection.getByLabel("Phone Number")
  }

  get saveProfileButton(): Locator {
    return this.profileSection.getByRole("button", { name: "Save Changes" })
  }

  get companySection(): Locator {
    return this.sectionByHeading("Company Information")
  }

  get companyNameInput(): Locator {
    return this.companySection.getByLabel("Company Name")
  }

  get saveCompanyButton(): Locator {
    return this.companySection.getByRole("button", { name: "Save Changes" })
  }

  get addressSection(): Locator {
    return this.sectionByHeading("Addresses")
  }

  get addNewAddressButton(): Locator {
    return this.addressSection.getByRole("button", { name: "Add New", exact: true })
  }

  /** Mock data seeds exactly one address card, so this is unambiguous without scoping by title. */
  get editAddressButton(): Locator {
    return this.addressSection.getByRole("button", { name: "Edit" })
  }

  get addressTitleInput(): Locator {
    return this.addressSection.getByLabel("Address Title (e.g. Home, Office)")
  }

  get addressFullNameInput(): Locator {
    return this.addressSection.getByLabel("Full Name")
  }

  get addressPhoneInput(): Locator {
    return this.addressSection.getByLabel("Phone Number")
  }

  get addressZipInput(): Locator {
    return this.addressSection.getByLabel("Zip Code")
  }

  get addressSearchInput(): Locator {
    return this.addressSection.getByLabel(/Search Address/)
  }

  addressSuggestion(description: string): Locator {
    return this.page.getByRole("option", { name: description })
  }

  get saveAddressButton(): Locator {
    return this.addressSection.getByRole("button", { name: "Save", exact: true })
  }
}

/**
 * Standalone (non-embedded) `AddressManagementShared` render at
 * `/buyer-dashboard/settings/addresses` - the buyer-only counterpart to the address section
 * embedded in the vendor settings page above. Kept in this file since both model the same
 * shared component; a third page-object file would just duplicate its locators.
 */
export class BuyerAddressesPage extends BasePage {
  readonly path = "/buyer-dashboard/settings/addresses"

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "My Addresses" })
  }

  get addNewAddressButton(): Locator {
    return this.page.getByRole("button", { name: "Add New Address" })
  }
}
