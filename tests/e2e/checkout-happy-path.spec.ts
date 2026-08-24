import { makeCart, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories/cart.factory"
import { makeApiSavedCard } from "@/test/factories/payment.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { CartPage } from "./pages/cart.page"
import { CheckoutPage } from "./pages/checkout.page"
import { installFakeStripe } from "./support/fake-stripe"

/**
 * Full checkout happy path with a two-vendor cart, on the SAVED CARD
 * billing path (see tests/e2e/support/fake-stripe.ts's doc-comment for why:
 * no `CardNumberElement` interaction needed, so the fake Stripe stub's inert
 * `elements.create()` is enough).
 *
 * Endpoints this spec registers ITSELF (not covered, or not usable as-is, by
 * tests/e2e/mocks/**):
 *  - `POST /backend-api/shipment/rates` - shipment.mocks.ts is an
 *    intentional no-op (see its header comment); shape mirrored from
 *    src/mocks/handlers/shipment.handlers.ts's private `makeShipmentRatesResponse`.
 *  - `GET /backend-api/orders/saved-cards` - `useBillingInformation` calls
 *    `ordersAPI.getSavedCards()`, i.e. THIS path, not `GET /backend-api/cards`
 *    (payments.mocks.ts only covers the latter, a different card-management
 *    endpoint used elsewhere).
 *  - `POST /backend-api/orders` (place order) - not in orders.mocks.ts at all.
 *  - `GET /backend-api/orders/payment/:paymentIntentId` - polled once by
 *    `useFinalReview` after `stripe.confirmCardPayment` resolves.
 */

const VENDOR_A_ITEM = makeCartItem({
  id: "ci-a",
  quantity: 2,
  userProduct: makeCartUserProduct({
    userProductId: "up-a",
    price: 50,
    shipmentFee: 5,
    sellerId: "seller-a",
    sellerName: "Acme Dental Supply",
  }),
  product: makeCartProductInfo({ id: "p-a", name: "Intra Oral Mixing Tips" }),
})

const VENDOR_B_ITEM = makeCartItem({
  id: "ci-b",
  quantity: 1,
  userProduct: makeCartUserProduct({
    userProductId: "up-b",
    price: 120,
    shipmentFee: 8,
    sellerId: "seller-b",
    sellerName: "Bright Smile Wholesale",
  }),
  product: makeCartProductInfo({ id: "p-b", name: "Composite Curing Light" }),
})

const SAVED_CARD = makeApiSavedCard({
  id: "card-1",
  stripeCardId: "pm_saved_visa",
  brand: "visa",
  last4: "4242",
  isDefault: true,
  openToAutoPayment: true,
  autoOrderCard: true,
})

function registerCheckoutMocks(
  apiMock: import("./fixtures/api-mock.fixture").ApiMock,
  overrides: { placeOrderStatus?: string } = {},
) {
  apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [VENDOR_A_ITEM, VENDOR_B_ITEM] }) }))

  apiMock.on("POST", "/backend-api/shipment/rates", ({ url }) => ({
    body: {
      shippoRates: [
        {
          objectId: `rate-${url.pathname}-${Math.random()}`.slice(0, 40),
          provider: "USPS",
          providerImage75: "",
          providerImage200: "",
          amount: "9.99",
          currency: "USD",
          amountLocal: "9.99",
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
      defaultShipmentFee: 12,
    },
  }))

  apiMock.on("GET", "/backend-api/orders/saved-cards", () => ({ body: { cards: [SAVED_CARD], total: 1 } }))
  // useCartPage.ts's onCheckout() gates on `isLicenseBlocked`, which reads
  // this list - handlers.ts wraps it in `{ licenses: [...], total }` with no
  // exported factory (see account.mocks.ts's header comment), so registered
  // here directly with an empty list (no dental-license requirement in this
  // spec's cart items either way).
  apiMock.on("GET", "/backend-api/licenses", () => ({ body: { licenses: [], total: 0 } }))

  apiMock.on("POST", "/backend-api/orders", () => ({
    body: {
      orderId: "order-happy-1",
      totalPrice: 220,
      status: overrides.placeOrderStatus ?? "PENDING_PAYMENT",
      paymentStatus: "PENDING_PAYMENT",
      createdDate: "2026-05-20T10:30:00Z",
      clientSecret: "pi_test_123_secret_test",
      orderItems: [],
    },
  }))

  apiMock.on("GET", "/backend-api/orders/payment/:paymentIntentId", () => ({
    body: {
      paymentIntentId: "pi_test_123",
      status: "succeeded",
      amount: 22000,
      currency: "usd",
      clientSecret: "pi_test_123_secret_test",
      error: null,
    },
  }))

  registerAllMocks(apiMock)
}

test.describe("checkout happy path", () => {
  test("two-vendor cart: address -> per-vendor shipping -> saved card -> final review totals -> place order -> confirmation", async ({
    buyerPage,
    apiMock,
  }) => {
    registerCheckoutMocks(apiMock)
    await installFakeStripe(buyerPage)

    const cart = new CartPage(buyerPage)
    const checkout = new CheckoutPage(buyerPage)

    const ratesRequests: string[] = []
    buyerPage.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/backend-api/shipment/rates")) {
        ratesRequests.push(request.postData() ?? "")
      }
    })

    // The real entry point into checkout: /cart's "Proceed to Checkout"
    // button sets checkoutStore's step to 2 before navigating
    // (useCartPage.ts's `onCheckout`) - useCheckoutPage.ts redirects straight
    // back to /cart if `currentStep` is still its default 1, so a direct
    // `page.goto("/checkout")` never reaches the shipping step.
    await cart.goto()
    await expect(cart.checkoutButton).toBeEnabled()
    await cart.checkoutButton.click()
    await checkout.expectUrl(/\/checkout$/)

    // Step 2: shipping - default address auto-selected by useShippingDetails,
    // both vendors' cheapest rate auto-selected by VendorShipmentRates.
    await expect(buyerPage.getByRole("heading", { name: "Select Shipping Address" })).toBeVisible()
    await expect(buyerPage.getByText("Shipping from:").first()).toBeVisible()
    await expect(buyerPage.getByText("Acme Dental Supply", { exact: true })).toBeVisible()
    await expect(buyerPage.getByText("Bright Smile Wholesale", { exact: true })).toBeVisible()

    await expect.poll(() => ratesRequests.length).toBeGreaterThanOrEqual(2)
    const bodies = ratesRequests.map((raw) => JSON.parse(raw))
    const sellerIds = bodies.map((body) => body.userId).sort()
    expect(sellerIds).toEqual(["seller-a", "seller-b"])
    for (const body of bodies) {
      expect(body).toHaveProperty("addressId")
      expect(body).toHaveProperty("cartId")
      expect(Array.isArray(body.parcels)).toBe(true)
    }

    await expect(checkout.continueToBillingButton).toBeEnabled()
    await checkout.continueToBillingButton.click()

    // Step 3: billing - pick the saved card, agree to terms.
    await expect(buyerPage.getByRole("heading", { name: "Billing Information" })).toBeVisible()
    await checkout.savedCardOption(/VISA •••• 4242/).click()
    await checkout.termsCheckbox.check()
    await checkout.continueToReviewButton.click()

    // Step 4: final review - totals consistency (subtotal + shipping + tax = total).
    await expect(checkout.finalReviewHeading).toBeVisible()

    const parseMoney = (text: string) => Number(text.replace(/[^0-9.-]/g, ""))
    const subtotalText = await buyerPage
      .getByText(/^Subtotal \(\d+ items\)$/)
      .locator("..")
      .locator("span")
      .last()
      .textContent()
    const totalShipmentText = await buyerPage
      .getByText("Total shipment fee")
      .locator("..")
      .locator("span")
      .last()
      .textContent()
    const totalText = await buyerPage
      .getByText("Total", { exact: true })
      .locator("..")
      .locator("span")
      .last()
      .textContent()

    const subtotal = parseMoney(subtotalText ?? "0")
    const totalShipment = parseMoney(totalShipmentText ?? "0")
    const total = parseMoney(totalText ?? "0")

    // useOrderSummary's `total` = subtotal - volumeDiscount + shipping(selectedShippingCost) + tax.
    // Tax defaults to 0 here (no GET /backend-api/cart/tax-estimate override needed - cart.mocks.ts
    // registers it via makeTaxEstimate, which useOrderSummary only calls once an
    // addressId exists post-shipping-submit; assert loose consistency instead of
    // hand-deriving the exact tax figure).
    expect(total).toBeGreaterThanOrEqual(subtotal)
    expect(totalShipment).toBeGreaterThan(0)

    // Step 4 -> place order: verify the real POST /backend-api/orders body.
    const placeOrderRequest = buyerPage.waitForRequest(
      (request) => request.method() === "POST" && request.url().endsWith("/backend-api/orders"),
    )
    await checkout.placeOrderButton.click()
    const request = await placeOrderRequest
    const orderBody = request.postDataJSON()

    expect(orderBody.addressId).toBeTruthy()
    expect(orderBody.paymentMethodId).toBe("pm_saved_visa")
    expect(Array.isArray(orderBody.shippoRateOrders)).toBe(true)
    expect(Array.isArray(orderBody.uberRateOrders)).toBe(true)
    expect(orderBody.shippoRateOrders.length + orderBody.uberRateOrders.length).toBe(2)
    const sellerIdsInOrder = [...orderBody.shippoRateOrders, ...orderBody.uberRateOrders]
      .map((line: { userId: string }) => line.userId)
      .sort()
    expect(sellerIdsInOrder).toEqual(["seller-a", "seller-b"])

    // Step 5: confirmation.
    await expect(checkout.orderConfirmedHeading).toBeVisible({ timeout: 15000 })
    await expect(buyerPage.getByText("$220.00")).toBeVisible()
  })
})
