import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Cart page (`/cart`). See src/features/cart/**. */
export class CartPage extends BasePage {
  readonly path = "/cart"

  get cartItemCards(): Locator {
    // CartItemCard.tsx has no shared testid/role; scope by the "Remove item" button each one carries.
    return this.page.locator("div", { has: this.page.getByRole("button", { name: "Remove item" }) }).first()
  }

  get removeItemButtons(): Locator {
    return this.page.getByRole("button", { name: "Remove item" })
  }

  get increaseQuantityButton(): Locator {
    // QuantityStepper - see components/ui/QuantityStepper.tsx; no explicit aria-label observed
    // in the cart feature, so fall back to icon-button ordering within the stepper.
    return this.page.getByRole("button", { name: "Increase quantity" })
  }

  get decreaseQuantityButton(): Locator {
    return this.page.getByRole("button", { name: "Decrease quantity" })
  }

  get autoReorderCheckbox(): Locator {
    return this.page.getByLabel("Auto-reorder this item")
  }

  get autoReorderFrequencySelect(): Locator {
    return this.page.getByLabel("Auto-reorder frequency")
  }

  get checkoutButton(): Locator {
    return this.page.getByRole("button", { name: "Proceed to Checkout" })
  }

  get clearCartButton(): Locator {
    return this.page.getByRole("button", { name: /clear cart/i })
  }

  get emptyStateHeading(): Locator {
    return this.page.getByText("Your Cart is Empty")
  }

  get continueShoppingButton(): Locator {
    return this.page.getByRole("button", { name: "Continue Shopping" })
  }

  get checkoutBlockedNotice(): Locator {
    return this.page.getByText("Checkout is blocked")
  }
}
