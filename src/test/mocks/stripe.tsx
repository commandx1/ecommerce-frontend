import type { InputHTMLAttributes, ReactNode } from "react"
import { vi } from "vitest"

/**
 * Stripe helpers are intentionally NOT registered globally — payment tests opt in with
 * `vi.mock("@stripe/stripe-js", ...)` / `vi.mock("@stripe/react-stripe-js", ...)` and feed these
 * factories in, so non-payment suites keep the real modules.
 *
 * Important: the Stripe SDK does not throw on card errors, it resolves with
 * `{ error: { type, code, message } }`. The helpers below model that faithfully.
 */

export interface StripeErrorShape {
  type: string
  code: string
  message: string
  decline_code?: string
}

export const stripeError = (
  message: string,
  { type = "card_error", code = "card_declined", decline_code }: Partial<StripeErrorShape> = {},
): { error: StripeErrorShape } => ({
  error: { type, code, message, ...(decline_code ? { decline_code } : {}) },
})

export const stripePaymentMethod = (id = "pm_test_123") => ({
  paymentMethod: { id, type: "card", card: { brand: "visa", last4: "4242" } },
})

export const stripePaymentIntent = (status = "succeeded", id = "pi_test_123") => ({
  paymentIntent: { id, status, client_secret: `${id}_secret_test` },
})

export const stripeSetupIntent = (status = "succeeded", id = "seti_test_123") => ({
  setupIntent: { id, status, client_secret: `${id}_secret_test` },
})

export const createElementsMock = () => ({
  create: vi.fn(),
  getElement: vi.fn(() => ({ mount: vi.fn(), unmount: vi.fn(), on: vi.fn(), clear: vi.fn(), destroy: vi.fn() })),
  update: vi.fn(),
  submit: vi.fn().mockResolvedValue({}),
})

/** A resolved Stripe instance. Override any method per test: `s.confirmCardPayment.mockResolvedValue(...)`. */
export const createFakeStripe = () => ({
  createPaymentMethod: vi.fn().mockResolvedValue(stripePaymentMethod()),
  createToken: vi.fn().mockResolvedValue({ token: { id: "tok_test_123" } }),
  confirmCardPayment: vi.fn().mockResolvedValue(stripePaymentIntent()),
  confirmCardSetup: vi.fn().mockResolvedValue(stripeSetupIntent()),
  confirmSetupIntent: vi.fn().mockResolvedValue(stripeSetupIntent()),
  confirmPayment: vi.fn().mockResolvedValue(stripePaymentIntent()),
  retrievePaymentIntent: vi.fn().mockResolvedValue(stripePaymentIntent()),
  handleCardAction: vi.fn().mockResolvedValue(stripePaymentIntent()),
  elements: vi.fn(() => createElementsMock()),
})

export type FakeStripe = ReturnType<typeof createFakeStripe>

/** Factory for `vi.mock("@stripe/stripe-js", ...)`. */
export const stripeJsMock = (stripe: FakeStripe = createFakeStripe()) => ({
  loadStripe: vi.fn().mockResolvedValue(stripe),
})

type CardElementProps = InputHTMLAttributes<HTMLInputElement> & {
  options?: unknown
  onChange?: (event: unknown) => void
  onReady?: (element: unknown) => void
}

const accessibleElement = (label: string) =>
  function StripeElementStub({ options: _options, onReady: _onReady, ...rest }: CardElementProps) {
    return <input aria-label={label} {...rest} />
  }

export const CardElementStub = accessibleElement("Card number")
export const CardNumberElementStub = accessibleElement("Card number")
export const CardExpiryElementStub = accessibleElement("Expiration date")
export const CardCvcElementStub = accessibleElement("CVC")
export const PaymentElementStub = accessibleElement("Payment details")

/**
 * Factory for `vi.mock("@stripe/react-stripe-js", ...)`.
 * Pass `null` to model "SDK not loaded yet" — `useStripe()` / `useElements()` then return null.
 */
export const reactStripeMock = (stripe: FakeStripe | null = createFakeStripe()) => ({
  Elements: ({ children }: { children?: ReactNode }) => <>{children}</>,
  ElementsConsumer: ({ children }: { children?: (props: unknown) => ReactNode }) =>
    children?.({ stripe, elements: stripe ? createElementsMock() : null }) ?? null,
  CardElement: CardElementStub,
  CardNumberElement: CardNumberElementStub,
  CardExpiryElement: CardExpiryElementStub,
  CardCvcElement: CardCvcElementStub,
  PaymentElement: PaymentElementStub,
  useStripe: () => stripe,
  useElements: () => (stripe ? createElementsMock() : null),
})

/** Convenience: the "Stripe SDK has not finished loading" variant. */
export const reactStripeNotLoadedMock = () => reactStripeMock(null)
