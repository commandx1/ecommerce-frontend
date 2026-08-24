import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Faz 8.2 - /buyer-dashboard/auto-orders. */
export class BuyerAutoOrdersPage extends BasePage {
  readonly path = "/buyer-dashboard/auto-orders"

  /**
   * FINDING: overrides BasePage's `toast` getter. The installed `sonner`
   * (grepped node_modules/sonner/dist/index.mjs - zero occurrences of the
   * string "role" in the whole bundle) never renders `role="status"`; each
   * toast is a plain `<li data-sonner-toast>`. BasePage's
   * `[data-sonner-toaster] [role='status']` locator therefore matches
   * nothing for every toast on this page (verified against the real DOM),
   * so it's shadowed here rather than relying on the shared (out-of-scope)
   * base locator.
   */
  get toast(): Locator {
    return this.page.locator("[data-sonner-toaster] li[data-sonner-toast]")
  }

  get filterAll(): Locator {
    return this.page.getByRole("button", { name: "All" })
  }

  get filterActive(): Locator {
    return this.page.getByRole("button", { name: "Active" })
  }

  get filterPaused(): Locator {
    return this.page.getByRole("button", { name: "Paused" })
  }

  /** Auto order card for the given product name. */
  card(productName: string | RegExp): Locator {
    return this.page.locator("article", { has: this.page.getByRole("heading", { name: productName, level: 3 }) })
  }

  editButton(productName: string | RegExp): Locator {
    return this.card(productName).getByRole("button", { name: "Edit" })
  }

  pauseButton(productName: string | RegExp): Locator {
    return this.card(productName).getByRole("button", { name: "Pause" })
  }

  resumeButton(productName: string | RegExp): Locator {
    return this.card(productName).getByRole("button", { name: "Resume" })
  }

  removeButton(productName: string | RegExp): Locator {
    return this.card(productName).getByRole("button", { name: "Remove" })
  }

  get readinessBanner(): Locator {
    return this.page.getByText("Your auto orders can't run yet")
  }

  // -- Edit modal (Radix Dialog, role="dialog") --

  get editDialog(): Locator {
    return this.page.getByRole("dialog")
  }

  get editModalHeading(): Locator {
    // The Radix Dialog also renders a visually-hidden `<h2>` (DialogTitle,
    // used as the dialog's accessible name) alongside the modal body's own
    // visible `<h3>Edit auto order</h3>` - scope to level 3 to avoid a
    // strict-mode collision between the two.
    return this.editDialog.getByRole("heading", { name: "Edit auto order", level: 3 })
  }

  get frequencySelect(): Locator {
    return this.editDialog.getByRole("combobox", { name: "Auto order frequency" })
  }

  frequencyOption(label: string | RegExp): Locator {
    // Radix Select renders its options into a portal, not inside the dialog subtree.
    return this.page.getByRole("option", { name: label })
  }

  get quantityIncreaseButton(): Locator {
    return this.editDialog.getByRole("button", { name: "Increase quantity" })
  }

  get frequencyChangedNotice(): Locator {
    return this.editDialog.getByText(/Changing the frequency restarts the countdown/)
  }

  get saveChangesButton(): Locator {
    return this.editDialog.getByRole("button", { name: "Save changes" })
  }

  get cancelEditButton(): Locator {
    return this.editDialog.getByRole("button", { name: "Cancel" })
  }

  // -- Delete confirmation modal --

  get deleteDialog(): Locator {
    return this.page.getByRole("dialog")
  }

  get confirmRemoveButton(): Locator {
    return this.deleteDialog.getByRole("button", { name: "Remove", exact: true })
  }

  get keepItButton(): Locator {
    return this.deleteDialog.getByRole("button", { name: "Keep it" })
  }
}
