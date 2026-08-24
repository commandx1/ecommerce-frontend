import type { Page } from "@playwright/test"

/**
 * Blocks the real `https://js.stripe.com/v3` script (both
 * `src/features/checkout/components/FinalReview.tsx` and
 * `BillingInformation.tsx` call `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`
 * at module scope, and that key IS set in .env.local for local dev - so
 * without this, `Elements` would try to load Stripe's real iframe-based SDK
 * over the network) and serves a fake `window.Stripe` factory instead, so
 * `@stripe/react-stripe-js`'s `Elements`/`useStripe()` resolve to a real,
 * synchronous-looking object without any network dependency or iframe.
 *
 * This only covers the SAVED-CARD checkout path (no `CardNumberElement`
 * interaction needed - `elements.create()` returns an inert stub whose
 * `mount()` is a no-op, so nothing renders for a "new card" flow). Specs
 * that need to type into a real card field are out of scope for this stub.
 */
export interface FakeStripeOptions {
  /**
   * JSON-serialisable result(s) for `stripe.confirmCardPayment()`. A single
   * value is returned on every call; an array is consumed one result per
   * call (in order), with the LAST entry repeating once exhausted - lets a
   * spec model "declined on the first attempt, succeeds on retry" without
   * re-installing the route mid-test. Default: a succeeded payment intent.
   */
  confirmCardPaymentResult?: unknown | unknown[]
}

const DEFAULT_CONFIRM_RESULT = {
  paymentIntent: { id: "pi_test_123", status: "succeeded", client_secret: "pi_test_123_secret_test" },
}

export async function installFakeStripe(page: Page, options: FakeStripeOptions = {}): Promise<void> {
  const results = options.confirmCardPaymentResult ?? DEFAULT_CONFIRM_RESULT
  const resultsQueueJson = JSON.stringify(Array.isArray(results) ? results : [results])

  const script = `
    window.__fakeStripeConfirmResults = ${resultsQueueJson};
    window.__fakeStripeConfirmCallCount = 0;
    window.Stripe = function () {
      function fakeElement() {
        return {
          mount: function () {},
          unmount: function () {},
          on: function () {},
          off: function () {},
          update: function () {},
          clear: function () {},
          destroy: function () {},
          blur: function () {},
          focus: function () {},
        }
      }
      return {
        elements: function () {
          return {
            create: function () { return fakeElement() },
            getElement: function () { return null },
            update: function () {},
          }
        },
        createPaymentMethod: function () {
          return Promise.resolve({
            paymentMethod: { id: "pm_test_card", type: "card", card: { brand: "visa", last4: "4242" } },
          })
        },
        // @stripe/react-stripe-js's isStripe() guard (see its Elements
        // component) requires elements/createToken/createPaymentMethod/
        // confirmCardPayment to ALL be functions, or it throws "Invalid prop
        // \`stripe\` supplied to \`Elements\`" and refuses to use the object -
        // createToken is unused by this app but still has to exist.
        createToken: function () {
          return Promise.resolve({ token: { id: "tok_test_123" } })
        },
        confirmCardPayment: function () {
          var queue = window.__fakeStripeConfirmResults;
          var index = Math.min(window.__fakeStripeConfirmCallCount, queue.length - 1);
          window.__fakeStripeConfirmCallCount += 1;
          return Promise.resolve(queue[index])
        },
        confirmCardSetup: function () {
          return Promise.resolve({ setupIntent: { status: "succeeded" } })
        },
        retrievePaymentIntent: function () {
          var queue = window.__fakeStripeConfirmResults;
          return Promise.resolve(queue[queue.length - 1])
        },
      }
    }
  `

  await page.route("https://js.stripe.com/v3**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: script }),
  )
}
