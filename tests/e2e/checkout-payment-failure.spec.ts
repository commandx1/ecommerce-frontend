import { makeCart, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories/cart.factory"
import { makeApiSavedCard } from "@/test/factories/payment.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { CartPage } from "./pages/cart.page"
import { CheckoutPage } from "./pages/checkout.page"
import { installFakeStripe } from "./support/fake-stripe"

/**
 * Payment failure at the backend contract level: `POST /backend-api/orders`
 * (src/lib/api/orders.ts's `ordersAPI.placeOrder`) itself rejects the
 * request (4xx + an error body), which is the failure branch
 * `useFinalReview.onPlaceOrder`'s OUTER catch handles - `ordersAPI.placeOrder`
 * throws before any Stripe call happens, so no order row and no charge are
 * created at all:
 *
 *   const response = await ordersAPI.placeOrder(payload)   // throws here
 *   ...
 *   } catch (error: unknown) {
 *     const maybeError = error as { response?: { data?: { message?: string } } }
 *     showToast.error(maybeError.response?.data?.message || "Failed to place order. Please try again.")
 *   } finally {
 *     isPlacingOrderRef.current = false
 *     setIsPlacingOrder(false)
 *   }
 *
 * `nextStep()`/`setOrderResult()` are never reached, so the buyer stays on
 * Final Review (step 4) with the error message from the response body.
 */

const ITEM = makeCartItem({
  id: "ci-fail",
  quantity: 1,
  userProduct: makeCartUserProduct({
    userProductId: "up-fail",
    price: 75,
    shipmentFee: 6,
    sellerId: "seller-fail",
    sellerName: "Precision Dental Tools",
  }),
  product: makeCartProductInfo({ id: "p-fail", name: "Autoclave Sterilization Pouches" }),
})

const SAVED_CARD = makeApiSavedCard({
  id: "card-fail",
  stripeCardId: "pm_fail_test",
  brand: "visa",
  last4: "0002",
  isDefault: true,
  openToAutoPayment: true,
  autoOrderCard: true,
})

test.describe("checkout payment failure", () => {
  test("a rejected place-order request keeps the buyer on Final Review, preserves the cart, and a retry succeeds", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart({ cartItems: [ITEM] }) }))
    apiMock.on("POST", "/backend-api/shipment/rates", () => ({
      body: {
        shippoRates: [
          {
            objectId: "rate-fail-1",
            provider: "USPS",
            providerImage75: "",
            providerImage200: "",
            amount: "7.25",
            currency: "USD",
            amountLocal: "7.25",
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
        defaultShipmentFee: 7,
      },
    }))
    apiMock.on("GET", "/backend-api/orders/saved-cards", () => ({ body: { cards: [SAVED_CARD], total: 1 } }))
    apiMock.on("GET", "/backend-api/licenses", () => ({ body: { licenses: [], total: 0 } }))

    // First POST /backend-api/orders call is declined by the (mocked)
    // payment processor; the retry succeeds. `placeOrderAttempts` is closed
    // over by the handler below, not reset between calls within this test.
    let placeOrderAttempts = 0
    apiMock.on("POST", "/backend-api/orders", () => {
      placeOrderAttempts += 1
      if (placeOrderAttempts === 1) {
        return {
          status: 402,
          body: { message: "Your card was declined by the payment processor. Please try a different card." },
        }
      }
      return {
        body: {
          orderId: "order-retry-1",
          totalPrice: 82.25,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING_PAYMENT",
          createdDate: "2026-05-20T10:30:00Z",
          clientSecret: "pi_test_retry_secret_test",
          orderItems: [],
        },
      }
    })
    apiMock.on("GET", "/backend-api/orders/payment/:paymentIntentId", () => ({
      body: {
        paymentIntentId: "pi_test_retry",
        status: "succeeded",
        amount: 8225,
        currency: "usd",
        clientSecret: "pi_test_retry_secret_test",
        error: null,
      },
    }))

    registerAllMocks(apiMock)
    await installFakeStripe(buyerPage)

    // Track any cart-clearing call - a rejected order must never clear the cart.
    let cartDeleteCalled = false
    buyerPage.on("request", (request) => {
      if (request.method() === "DELETE" && request.url().includes("/backend-api/cart")) {
        cartDeleteCalled = true
      }
    })

    const cart = new CartPage(buyerPage)
    const checkout = new CheckoutPage(buyerPage)

    await cart.goto()
    await expect(cart.checkoutButton).toBeEnabled()
    await cart.checkoutButton.click()
    await checkout.expectUrl(/\/checkout$/)

    await expect(buyerPage.getByRole("heading", { name: "Select Shipping Address" })).toBeVisible()
    await expect(checkout.continueToBillingButton).toBeEnabled()
    await checkout.continueToBillingButton.click()

    await expect(buyerPage.getByRole("heading", { name: "Billing Information" })).toBeVisible()
    await checkout.savedCardOption(/VISA •••• 0002/).click()
    await checkout.termsCheckbox.check()
    await checkout.continueToReviewButton.click()

    await expect(checkout.finalReviewHeading).toBeVisible()

    // First attempt: rejected.
    const firstAttempt = buyerPage.waitForRequest(
      (request) => request.method() === "POST" && request.url().endsWith("/backend-api/orders"),
    )
    await checkout.placeOrderButton.click()
    await firstAttempt

    await expect(checkout.toast).toContainText(/declined by the payment processor/)
    // Stays on Final Review - never reaches order confirmation (step 5).
    await expect(checkout.finalReviewHeading).toBeVisible()
    await expect(checkout.orderConfirmedHeading).toBeHidden()

    // Cart preserved: no DELETE /cart within a short grace window, and the
    // order summary sidebar (still driven by the live cart, unaffected by
    // the failed order) still lists the item.
    await buyerPage.waitForTimeout(500)
    expect(cartDeleteCalled).toBe(false)
    await expect(buyerPage.getByText("Autoclave Sterilization Pouches")).toBeVisible()

    // Retry, without navigating away - checkoutStore.currentStep never
    // advanced past 4 (Final Review) and `orderPayload` was never cleared,
    // so clicking Place Order again resubmits the same shipping/payment
    // choice. (Navigating back through /cart would reset the flow to step 2
    // - see useCartPage.ts's onCheckout - which is not what "retry" means
    // here.)
    const secondAttempt = buyerPage.waitForRequest(
      (request) => request.method() === "POST" && request.url().endsWith("/backend-api/orders"),
    )
    await checkout.placeOrderButton.click()
    await secondAttempt

    await expect(checkout.orderConfirmedHeading).toBeVisible({ timeout: 15000 })
    expect(placeOrderAttempts).toBe(2)
    expect(cartDeleteCalled).toBe(false)
  })
})
