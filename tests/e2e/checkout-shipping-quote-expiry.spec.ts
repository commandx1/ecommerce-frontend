import type { Page } from "@playwright/test"
import { makeCart, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories/cart.factory"
import { makeApiSavedCard } from "@/test/factories/payment.factory"
import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { CartPage } from "./pages/cart.page"
import { CheckoutPage } from "./pages/checkout.page"
import { installFakeStripe } from "./support/fake-stripe"

/**
 * The 10-minute shipping-quote TTL (`SHIPPING_QUOTE_TTL_MS`,
 * src/features/checkout/lib/shipping-quote-expiry.ts). Two independent defenses guard it, and
 * this spec covers both:
 *
 *  - `useShippingQuoteExpiry`'s background `setTimeout`, armed on steps 3-4, which bounces the
 *    buyer back to step 2 (toast + cleared selection) the instant the quote goes stale in an open
 *    tab.
 *  - `useFinalReview.onPlaceOrder`'s synchronous re-check, run right before a charge would
 *    otherwise be attempted - the last line of defense for a case the background timer can miss
 *    (its own doc-comment: "a background-tab timer that never got the chance to re-check").
 *
 * Uses Playwright's `page.clock` (installed BEFORE navigation, so `Date.now()`/timers are fake
 * from first paint - there is no other `page.clock` usage in this repo to follow, so the choice
 * of method per test is explained inline):
 *  - `clock.fastForward` for the first case: per Playwright's docs it "fires due timers at most
 *    once", i.e. it actually runs the background `setTimeout` - exactly the mechanism under test.
 *  - `clock.setSystemTime` for the second case: per Playwright's docs it "does not trigger any
 *    timers", i.e. `Date.now()` jumps forward but the background `setTimeout` never fires. That is
 *    precisely the race `onPlaceOrder`'s synchronous guard exists for, modelled directly instead
 *    of reaching into React/Zustand internals to fake it.
 *
 * Endpoints registered here directly (not reusable as-is from tests/e2e/mocks/**, see
 * checkout-happy-path.spec.ts's header comment for the same set): `POST /backend-api/shipment/rates`,
 * `GET /backend-api/orders/saved-cards`, `GET /backend-api/licenses`, `POST /backend-api/orders`.
 */

const ITEM = makeCartItem({
  id: "ci-exp",
  quantity: 1,
  userProduct: makeCartUserProduct({
    userProductId: "up-exp",
    price: 60,
    shipmentFee: 5,
    sellerId: "seller-exp",
    sellerName: "Steady Dental Supply",
  }),
  product: makeCartProductInfo({ id: "p-exp", name: "Endo File Set" }),
})

const SAVED_CARD = makeApiSavedCard({
  id: "card-exp",
  stripeCardId: "pm_exp_visa",
  brand: "visa",
  last4: "4242",
  isDefault: true,
  openToAutoPayment: true,
  autoOrderCard: true,
})

/** Frozen "now" the clock is installed at - every test's quote is fetched at exactly this time. */
const INSTALL_TIME = new Date("2026-05-20T10:00:00.000Z")

function registerExpiryMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [ITEM] }) }))

  apiMock.on("POST", "/backend-api/shipment/rates", ({ url }) => ({
    body: {
      shippoRates: [
        {
          objectId: `rate-${url.pathname}-${Math.random()}`.slice(0, 40),
          provider: "USPS",
          providerImage75: "",
          providerImage200: "",
          amount: "6.50",
          currency: "USD",
          amountLocal: "6.50",
          currencyLocal: "USD",
          arrivesBy: null,
          durationTerms: "Estimated 2-3 business days.",
          estimatedDays: 3,
          attributes: ["CHEAPEST"],
          servicelevel: {
            name: "Priority Mail",
            token: "usps_priority",
            terms: "",
            extendedToken: "usps_priority",
            parentServicelevel: null,
          },
          test: true,
        },
      ],
      uberQuote: null,
      defaultShipmentFee: 6,
    },
  }))

  apiMock.on("GET", "/backend-api/orders/saved-cards", () => ({ body: { cards: [SAVED_CARD], total: 1 } }))
  // useCartPage.ts's onCheckout() gates on this list - see checkout-happy-path.spec.ts's header
  // comment for why it is registered here directly rather than via account.mocks.ts.
  apiMock.on("GET", "/backend-api/licenses", () => ({ body: { licenses: [], total: 0 } }))

  apiMock.on("POST", "/backend-api/orders", () => ({
    body: {
      orderId: "order-exp-1",
      totalPrice: 65,
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING_PAYMENT",
      createdDate: "2026-05-20T10:30:00Z",
      clientSecret: "pi_exp_secret_test",
      orderItems: [],
    },
  }))

  registerAllMocks(apiMock)
}

/** Drives cart -> checkout through billing, landing on step 4 (Final Review) with a live quote. */
async function reachFinalReview(buyerPage: Page, checkout: CheckoutPage, cart: CartPage): Promise<void> {
  await cart.goto()
  await expect(cart.checkoutButton).toBeEnabled()
  await cart.checkoutButton.click()
  await checkout.expectUrl(/\/checkout$/)

  await expect(buyerPage.getByRole("heading", { name: "Shipping Address", level: 2 })).toBeVisible()
  // Single-vendor cart: the one auto-selected shipment radio (see checkout-happy-path.spec.ts for
  // why this is scoped to `name^="shipment-"` rather than every radio on the step).
  await expect(buyerPage.locator('input[name^="shipment-"]:checked')).toHaveCount(1)
  await expect(checkout.continueToBillingButton).toBeEnabled()
  await checkout.continueToBillingButton.click()

  await expect(buyerPage.getByRole("heading", { name: "Billing Information" })).toBeVisible()
  await checkout.savedCardOption(/VISA •••• 4242/).click()
  await checkout.termsCheckbox.check()
  await checkout.continueToReviewButton.click()

  await expect(checkout.finalReviewHeading).toBeVisible()
}

test.describe("checkout shipping quote expiry", () => {
  test("a stale quote on review bounces back to shipping with a fresh rates request", async ({
    buyerPage,
    apiMock,
  }) => {
    // MUST run before any navigation - Date.now()/timers are fake from the page's first script.
    await buyerPage.clock.install({ time: INSTALL_TIME })
    registerExpiryMocks(apiMock)
    await installFakeStripe(buyerPage)

    const ratesRequests: string[] = []
    buyerPage.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/backend-api/shipment/rates")) {
        ratesRequests.push(request.postData() ?? "")
      }
    })

    const cart = new CartPage(buyerPage)
    const checkout = new CheckoutPage(buyerPage)
    await reachFinalReview(buyerPage, checkout, cart)

    const requestsBeforeExpiry = ratesRequests.length
    expect(requestsBeforeExpiry).toBeGreaterThanOrEqual(1)

    // Past SHIPPING_QUOTE_TTL_MS (10 minutes): fastForward fires the due background setTimeout.
    await buyerPage.clock.fastForward("10:01")

    await expect(checkout.toast).toContainText("Shipping rates expired")
    await expect(buyerPage.getByRole("heading", { name: "Shipping Address", level: 2 })).toBeVisible()
    await expect(checkout.finalReviewHeading).toBeHidden()

    // Back on step 2 with the selection cleared - VendorShipmentRates re-fetches this vendor.
    await expect.poll(() => ratesRequests.length).toBeGreaterThan(requestsBeforeExpiry)
  })

  test("placing an order after the quote expired sends no POST /orders and redirects to shipping", async ({
    buyerPage,
    apiMock,
  }) => {
    await buyerPage.clock.install({ time: INSTALL_TIME })
    registerExpiryMocks(apiMock)
    await installFakeStripe(buyerPage)

    let placeOrderCalled = false
    buyerPage.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/backend-api/orders")) {
        placeOrderCalled = true
      }
    })

    const cart = new CartPage(buyerPage)
    const checkout = new CheckoutPage(buyerPage)
    await reachFinalReview(buyerPage, checkout, cart)

    // Jumps Date.now() past the TTL WITHOUT running the background setTimeout (setSystemTime
    // "does not trigger any timers") - models the missed-background-timer race
    // onPlaceOrder's synchronous guard exists for.
    await buyerPage.clock.setSystemTime(new Date(INSTALL_TIME.getTime() + 10 * 60 * 1000 + 5000))
    // Confirms the jump alone did not already redirect - only the click below should.
    await expect(checkout.finalReviewHeading).toBeVisible()

    await checkout.placeOrderButton.click()

    await expect(checkout.toast).toContainText("Shipping rates expired")
    await expect(buyerPage.getByRole("heading", { name: "Shipping Address", level: 2 })).toBeVisible()
    expect(placeOrderCalled).toBe(false)
  })
})
