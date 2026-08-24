import { makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories/auto-order.factory"
import { makeCart, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories/cart.factory"
import { makeApiSavedCard } from "@/test/factories/payment.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { BuyerAutoOrdersPage } from "./pages/buyer-auto-orders.page"
import { CartPage } from "./pages/cart.page"
import { CheckoutPage } from "./pages/checkout.page"
import { installFakeStripe } from "./support/fake-stripe"

/**
 * Auto-order consent gate at checkout (src/features/checkout/hooks/useBillingInformation.ts's
 * `onSubmit` and FinalReviewPaymentSection.tsx's `needsSavedCardConsent`), then
 * confirmation-screen auto-order registration
 * (src/features/checkout/hooks/useAutoOrderRegistration.ts polls
 * `GET /backend-api/auto-orders`), then the item actually listed on
 * /buyer-dashboard/auto-orders.
 *
 * Card choice matters here: the saved card used is built WITHOUT
 * `openToAutoPayment`, so `needsSavedCardConsent` is true and the consent
 * checkbox is required - a card that already has an off-session mandate
 * would skip the whole gate this spec is testing.
 */

const AUTO_ORDER_ITEM = makeCartItem({
  id: "ci-auto",
  quantity: 1,
  autoOrder: "ONE_MONTH",
  userProduct: makeCartUserProduct({
    userProductId: "up-auto",
    price: 40,
    shipmentFee: 4,
    sellerId: "seller-auto",
    sellerName: "Recurring Supplies Co",
  }),
  product: makeCartProductInfo({ id: "p-auto", name: "Nitrile Exam Gloves - Case" }),
})

const CARD_WITHOUT_MANDATE = makeApiSavedCard({
  id: "card-no-mandate",
  stripeCardId: "pm_no_mandate",
  brand: "mastercard",
  last4: "1881",
  isDefault: true,
  openToAutoPayment: false,
  autoOrderCard: false,
})

function registerCheckoutMocks(apiMock: import("./fixtures/api-mock.fixture").ApiMock) {
  apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [AUTO_ORDER_ITEM] }) }))
  apiMock.on("POST", "/backend-api/shipment/rates", () => ({
    body: {
      shippoRates: [
        {
          objectId: "rate-auto-1",
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
  apiMock.on("GET", "/backend-api/orders/saved-cards", () => ({ body: { cards: [CARD_WITHOUT_MANDATE], total: 1 } }))
  apiMock.on("GET", "/backend-api/licenses", () => ({ body: { licenses: [], total: 0 } }))
  apiMock.on("POST", "/backend-api/orders", () => ({
    body: {
      orderId: "order-auto-1",
      totalPrice: 50.5,
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING_PAYMENT",
      createdDate: "2026-05-20T10:30:00Z",
      clientSecret: "pi_test_auto_secret_test",
      orderItems: [],
    },
  }))
  apiMock.on("GET", "/backend-api/orders/payment/:paymentIntentId", () => ({
    body: {
      paymentIntentId: "pi_test_auto",
      status: "succeeded",
      amount: 5050,
      currency: "usd",
      clientSecret: "pi_test_auto_secret_test",
      error: null,
    },
  }))

  registerAllMocks(apiMock)
}

test.describe("checkout auto-order consent and registration", () => {
  test("consent is required to place an auto-order with a card that has no off-session mandate, then the order registers and appears in Auto Orders", async ({
    buyerPage,
    apiMock,
  }) => {
    // The confirmation screen polls this until the just-placed userProductId
    // shows up - registered fresh (not via registerAllMocks's default empty
    // list) so the FIRST poll already reports it as ready, keeping the test
    // fast instead of waiting through several 3s poll intervals.
    apiMock.on("GET", "/backend-api/auto-orders", () => ({
      body: makeAutoOrdersResponse({
        autoOrders: [
          makeAutoOrder({
            id: "auto-order-1",
            userProductId: "up-auto",
            productName: "Nitrile Exam Gloves - Case",
            period: "ONE_MONTH",
            active: true,
          }),
        ],
        total: 1,
      }),
    }))
    // BuyerAutoOrdersPage's readiness check (useAutoOrders) calls
    // GET /backend-api/cards too, separate from the checkout billing card
    // list above - not registered by registerAllMocks (see
    // buyer-auto-orders.spec.ts's own header comment on this).
    apiMock.on("GET", "/backend-api/cards", () => ({ body: { cards: [CARD_WITHOUT_MANDATE], total: 1 } }))
    registerCheckoutMocks(apiMock)
    await installFakeStripe(buyerPage)

    const cart = new CartPage(buyerPage)
    const checkout = new CheckoutPage(buyerPage)

    await cart.goto()
    await expect(cart.checkoutButton).toBeEnabled()
    await cart.checkoutButton.click()
    await checkout.expectUrl(/\/checkout$/)

    await expect(buyerPage.getByRole("heading", { name: "Select Shipping Address" })).toBeVisible()
    // Repeat items ship to the primary address by default in this spec's
    // mocked address list (account.mocks.ts's default `defaultAddress: true`
    // item), so the "primary address" auto-order notice should NOT appear here.
    await expect(checkout.autoOrderAddressNotice).toBeHidden()
    await expect(checkout.continueToBillingButton).toBeEnabled()
    await checkout.continueToBillingButton.click()

    await expect(buyerPage.getByRole("heading", { name: "Billing Information" })).toBeVisible()
    await checkout.savedCardOption(/MASTERCARD •••• 1881/).click()
    await checkout.termsCheckbox.check()

    // Consent checkbox required for this un-mandated card + auto-order item.
    await expect(checkout.autoOrderCardConsentCheckbox).toBeVisible()
    await expect(checkout.autoOrderCardConsentCheckbox).not.toBeChecked()

    // Without consent: clicking submit does not advance past billing.
    await checkout.continueToReviewButton.click()
    await expect(checkout.toast).toContainText(/Automatic payments not allowed yet/)
    await expect(buyerPage.getByRole("heading", { name: "Billing Information" })).toBeVisible()

    // With consent: advances normally.
    await checkout.autoOrderCardConsentCheckbox.check()
    await checkout.continueToReviewButton.click()

    await expect(checkout.finalReviewHeading).toBeVisible()
    await expect(buyerPage.getByText(/repeat item|auto.?order/i).first()).toBeVisible()

    const placeOrderRequest = buyerPage.waitForRequest(
      (request) => request.method() === "POST" && request.url().endsWith("/backend-api/orders"),
    )
    await checkout.placeOrderButton.click()
    const request = await placeOrderRequest
    const orderBody = request.postDataJSON()

    // useFinalReview.onPlaceOrder: for an EXISTING saved card without a
    // mandate, consent maps to `openToAutoOrder: true` (NOT `cardSave`/
    // `cardOpenToAutoPayment`, which are for a brand-new card).
    expect(orderBody.paymentMethodId).toBe("pm_no_mandate")
    expect(orderBody.openToAutoOrder).toBe(true)
    expect(orderBody.shippoRateOrders[0].products[0].autoOrder).toBe("ONE_MONTH")

    await expect(checkout.orderConfirmedHeading).toBeVisible({ timeout: 15000 })
    await expect(checkout.autoOrderNotice).toBeVisible({ timeout: 15000 })
    // Poll settles to "ready" once GET /auto-orders reports the userProductId.
    await expect(buyerPage.getByText(/will be reordered automatically/)).toBeVisible({ timeout: 15000 })

    // Follow the confirmation screen's own link into Auto Orders.
    const autoOrders = new BuyerAutoOrdersPage(buyerPage)
    await buyerPage.getByRole("link", { name: "Auto Orders" }).click()
    await autoOrders.expectUrl(/\/buyer-dashboard\/auto-orders/)
    await expect(autoOrders.card("Nitrile Exam Gloves - Case")).toBeVisible()
  })
})
