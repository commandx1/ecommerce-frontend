import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * /checkout — see src/features/checkout/**. Single-page, step-driven flow
 * (CheckoutStepContent switches on `useCheckoutStore().currentStep`, 1-5):
 *   1 cart review (redirects to /cart if empty, see useCheckoutPage)
 *   2 shipping   -> ShippingDetails (address + VendorShipmentRates per seller)
 *   3 billing    -> BillingInformation (payment method + saved/new card + terms)
 *   4 review     -> FinalReview (address/payment/auto-order summary + Place Order)
 *   5 confirmation -> OrderConfirmation
 *
 * Stripe: `FinalReview`/`BillingInformation` wrap their content in a real
 * `<Elements stripe={loadStripe(pk)}>` whenever
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set (it is, in .env.local) - specs
 * using this POM must block/fake `https://js.stripe.com/v3/**` themselves
 * (see checkout-happy-path.spec.ts's `installFakeStripe` helper) before
 * calling `goto()`.
 */
export class CheckoutPage extends BasePage {
  readonly path = "/checkout"

  // -- Step 2: shipping --

  addressCard(title: string | RegExp): Locator {
    return this.page.locator("label", { has: this.page.getByText(title) })
  }

  /** Selects the shipping address whose card contains this title/name text. */
  async selectAddress(title: string | RegExp): Promise<void> {
    await this.addressCard(title).click()
  }

  get addAddressButton(): Locator {
    return this.page.getByRole("button", { name: "Add New Address" })
  }

  get autoOrderAddressNotice(): Locator {
    return this.page.getByText("Repeat deliveries use your primary address")
  }

  /** A shipping rate radio for a given seller's section - scoped by the rate/service label text. */
  shippingRateOption(labelText: string | RegExp): Locator {
    return this.page.locator("label", { has: this.page.getByText(labelText) })
  }

  get continueToBillingButton(): Locator {
    return this.page.getByRole("button", { name: "Continue to Billing" })
  }

  // -- Step 3: billing --

  get cardPaymentOption(): Locator {
    return this.page.getByRole("radio", { name: /Credit\/Debit Card/i }).or(this.page.getByLabel(/Credit\/Debit Card/i))
  }

  /** Saved card radio, matched by its "BRAND •••• 1234" label text. */
  savedCardOption(brandLast4Text: string | RegExp): Locator {
    return this.page.locator("label", { has: this.page.getByText(brandLast4Text) })
  }

  get useNewCardOption(): Locator {
    return this.page.getByText("Use a new card")
  }

  get autoOrderCardConsentCheckbox(): Locator {
    return this.page.getByLabel(/Allow this card to be charged automatically for my repeat orders/)
  }

  get saveNewCardCheckbox(): Locator {
    return this.page.getByLabel(/Save this card for future purchases/)
  }

  get termsCheckbox(): Locator {
    return this.page.getByLabel(/I agree to the/)
  }

  get continueToReviewButton(): Locator {
    return this.page.getByRole("button", { name: "Continue to Review" })
  }

  get backToShippingButton(): Locator {
    return this.page.getByRole("button", { name: "Back to Shipping" })
  }

  // -- Step 4: final review --

  get placeOrderButton(): Locator {
    return this.page.getByRole("button", { name: "Place Order" })
  }

  get backToBillingButton(): Locator {
    return this.page.getByRole("button", { name: "Back to Billing" })
  }

  get finalReviewHeading(): Locator {
    return this.page.getByRole("heading", { name: "Final Review" })
  }

  get finalReviewUnavailableNotice(): Locator {
    return this.page.getByText("Stripe publishable key is missing")
  }

  // -- Step 5: confirmation --

  get orderConfirmedHeading(): Locator {
    return this.page.getByRole("heading", { name: "Order Confirmed!" })
  }

  get paymentFailedHeading(): Locator {
    return this.page.getByRole("heading", { name: "Payment Failed" })
  }

  get continueShoppingButton(): Locator {
    return this.page.getByRole("button", { name: "Continue Shopping" })
  }

  get viewOrdersLink(): Locator {
    return this.page.getByRole("link", { name: /View Orders/ })
  }

  get autoOrderNotice(): Locator {
    return this.page.getByText(
      /will be reordered automatically|Setting up automatic reordering|still being set up for automatic reordering/,
    )
  }

  // -- Order summary sidebar (visible on steps 1-4) --

  get orderSummaryHeading(): Locator {
    return this.page.getByRole("heading", { name: "Order Summary" })
  }

  get orderSummaryTotal(): Locator {
    return this.page.getByText("Total", { exact: true }).locator("..").locator("span").last()
  }
}
