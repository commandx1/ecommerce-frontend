import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Buyer payment methods page (`/buyer-dashboard/payment-methods`). */
export class BuyerPaymentMethodsPage extends BasePage {
  readonly path = "/buyer-dashboard/payment-methods"

  get addNewCardButton(): Locator {
    return this.page.getByRole("button", { name: "Add New Card" })
  }

  get nicknameInput(): Locator {
    return this.page.getByPlaceholder("e.g. Main Clinic Card")
  }

  get saveCardButton(): Locator {
    return this.page.getByRole("button", { name: "Save Card" })
  }

  get closeAddModalButton(): Locator {
    return this.page.getByRole("button", { name: "Cancel" })
  }

  removeCardTrigger(cardCard: Locator): Locator {
    return cardCard.getByRole("button", { name: "Remove" })
  }

  /**
   * Radix `PopoverContent` portals to `document.body`, appended after the
   * trigger - so once the popover is open there are two buttons named
   * "Remove" (the icon trigger + the destructive confirm button inside the
   * popover). `.last()` is the confirm button.
   */
  confirmRemoveButton(): Locator {
    return this.page.getByRole("button", { name: "Remove", exact: true }).last()
  }

  setDefaultTrigger(cardCard: Locator): Locator {
    return cardCard.getByRole("button", { name: "Set as Default" })
  }

  /** Confirm button inside the "Set as default?" popover. */
  confirmSetDefaultButton(): Locator {
    return this.page.getByRole("button", { name: "OK", exact: true })
  }

  /** A saved-card tile, scoped by its visible nickname text. */
  cardByNickname(nickname: string): Locator {
    return this.page.locator("article", { hasText: nickname }).first()
  }
}
