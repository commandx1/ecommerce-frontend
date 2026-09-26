import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { seedCart } from "@/test/cart"
import { makeCartItem, makeCartUserProduct } from "@/test/factories"
import { createFakeStripe, stripeError } from "@/test/mocks/stripe"
import { createTestQueryClient, render, screen, waitFor } from "@/test/render"

const { toastSpies, stripeRef } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_dentypro"
  return {
    stripeRef: { current: null as unknown as ReturnType<typeof createFakeStripe> },
    toastSpies: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      love: vi.fn(),
      loading: vi.fn(),
    },
  }
})

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("@stripe/stripe-js", () => ({ loadStripe: vi.fn(() => Promise.resolve({})) }))
vi.mock("@stripe/react-stripe-js", async () => {
  const actual = await import("@/test/mocks/stripe")
  return {
    ...actual.reactStripeMock(),
    useStripe: () => stripeRef.current,
    useElements: () => actual.createElementsMock(),
  }
})

import FinalReview from "./FinalReview"

const orderResponse = (overrides: Record<string, unknown> = {}) => ({
  orderId: "order-1",
  totalPrice: 112,
  status: "PENDING_PAYMENT",
  createdDate: "2026-08-22T10:00:00Z",
  clientSecret: "pi_1_secret_abc",
  orderItems: [],
  ...overrides,
})

/** Seeds a query client with the cart and the checkout store with a complete step-4 state; render with the returned client. */
const readyToPlaceOrder = (cartItems = [makeCartItem()]) => {
  const queryClient = createTestQueryClient()
  seedCart(queryClient, { cartId: "cart-1", cartItems })
  useCheckoutStore.setState({
    currentStep: 4,
    paymentMethodId: "pm_stripe_1",
    paymentMethodSummary: "Visa •••• 4242",
    orderPayload: {
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", userId: "seller-1", products: [{ userProductId: "up-1", quantity: 2 }] },
      ],
      uberRateOrders: [],
    },
  })
  return queryClient
}

beforeEach(() => {
  vi.restoreAllMocks()
  stripeRef.current = createFakeStripe()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  server.use(
    http.post("*/backend-api/orders", () => HttpResponse.json(orderResponse())),
    http.get("*/backend-api/orders/payment/:paymentIntentId", () =>
      HttpResponse.json({
        paymentIntentId: "pi_test_123",
        status: "succeeded",
        amount: 11200,
        currency: "usd",
        clientSecret: "pi_1_secret_abc",
        error: null,
      }),
    ),
  )
})

describe("FinalReview", () => {
  it("summarises the shipping address and the chosen payment method", () => {
    const queryClient = readyToPlaceOrder()
    render(<FinalReview />, { queryClient })

    expect(screen.getByRole("heading", { name: "Final Review" })).toBeInTheDocument()
    expect(screen.getByText("Visa •••• 4242")).toBeInTheDocument()
    expect(screen.getByText("Ready to Place Order")).toBeInTheDocument()

    // Next-step button is text-only: no arrow icon, symmetric horizontal padding.
    const placeOrderButton = screen.getByRole("button", { name: /Place Order/ })
    expect(placeOrderButton.querySelector("svg")).toBeNull()
    expect(placeOrderButton.className).toMatch(/\bpx-6\b/)
  })

  it("blocks Place Order while no Stripe payment method has been captured", () => {
    const queryClient = readyToPlaceOrder()
    useCheckoutStore.setState({ paymentMethodId: "" })

    render(<FinalReview />, { queryClient })

    expect(screen.getByRole("button", { name: /Place Order/ })).toBeDisabled()
  })

  it("blocks Place Order while the Stripe SDK has not loaded", () => {
    const queryClient = readyToPlaceOrder()
    stripeRef.current = null as unknown as ReturnType<typeof createFakeStripe>

    render(<FinalReview />, { queryClient })

    expect(screen.getByRole("button", { name: /Place Order/ })).toBeDisabled()
  })

  it("places the order, confirms the card and advances to the confirmation step", async () => {
    const user = userEvent.setup()
    const queryClient = readyToPlaceOrder()

    render(<FinalReview />, { queryClient })

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Order placed successfully. Order ID: order-1"))
    expect(stripeRef.current.confirmCardPayment).toHaveBeenCalledWith("pi_1_secret_abc", {
      payment_method: "pm_stripe_1",
    })
    expect(useCheckoutStore.getState().currentStep).toBe(5)
    expect(useCheckoutStore.getState().orderResult?.status).toBe("PAYMENT_SUCCESS")
  })

  it("shows a 'Placing Order...' state while the charge is in flight", async () => {
    const user = userEvent.setup()
    const queryClient = readyToPlaceOrder()
    let releaseOrder: (() => void) | undefined
    server.use(
      http.post("*/backend-api/orders", async () => {
        await new Promise<void>((resolve) => {
          releaseOrder = resolve
        })
        return HttpResponse.json(orderResponse())
      }),
    )

    render(<FinalReview />, { queryClient })

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    const submitting = await screen.findByRole("button", { name: /Placing Order/ })
    expect(submitting).toBeDisabled()

    releaseOrder?.()
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
  })

  it("keeps the buyer on step 4 when the card is declined", async () => {
    const user = userEvent.setup()
    const queryClient = readyToPlaceOrder()
    stripeRef.current.confirmCardPayment.mockResolvedValue(stripeError("Your card was declined."))

    render(<FinalReview />, { queryClient })

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Your card was declined."))
    expect(useCheckoutStore.getState().currentStep).toBe(4)
    // The decline reaches assistive tech through sonner's toaster region, which carries
    // `aria-live="polite"` (sonner 2.x, dist/index.mjs). An earlier version of this test
    // asserted the absence of a `role="alert"` region and read that as "AT users get no
    // error" - that inference was wrong, and the assertion was vacuous here anyway because
    // the toaster is not mounted in this test. Both are gone; the toast assertion above is
    // what actually proves the vendor is told.
  })

  it("does not double-submit while a placement is already running", async () => {
    const user = userEvent.setup()
    const queryClient = readyToPlaceOrder()
    let orderRequests = 0
    let releaseOrder: (() => void) | undefined
    server.use(
      http.post("*/backend-api/orders", async () => {
        orderRequests += 1
        await new Promise<void>((resolve) => {
          releaseOrder = resolve
        })
        return HttpResponse.json(orderResponse())
      }),
    )

    render(<FinalReview />, { queryClient })

    const button = screen.getByRole("button", { name: /Place Order/ })
    await user.click(button)
    await user.click(button)

    releaseOrder?.()
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    expect(orderRequests).toBe(1)
  })

  it("records an unpaid order when the backend returns no client secret", async () => {
    const user = userEvent.setup()
    const queryClient = readyToPlaceOrder()
    server.use(http.post("*/backend-api/orders", () => HttpResponse.json(orderResponse({ clientSecret: undefined }))))

    render(<FinalReview />, { queryClient })

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith(expect.stringContaining("created but not paid")))
    expect(useCheckoutStore.getState().orderResult?.status).toBe("PENDING_PAYMENT")
    expect(useCheckoutStore.getState().currentStep).toBe(4)
  })

  it("surfaces the backend's own message when the order cannot be created", async () => {
    const user = userEvent.setup()
    const queryClient = readyToPlaceOrder()
    server.use(
      http.post("*/backend-api/orders", () =>
        HttpResponse.json({ message: "One of the items is out of stock." }, { status: 409 }),
      ),
    )

    render(<FinalReview />, { queryClient })

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("One of the items is out of stock."))
    expect(stripeRef.current.confirmCardPayment).not.toHaveBeenCalled()
  })

  it("lists the repeat schedules the buyer is about to commit to", () => {
    const autoOrderItems = [
      makeCartItem({
        autoOrder: "ONE_MONTH",
        userProduct: makeCartUserProduct({ userProductId: "up-auto" }),
      }),
    ]
    const queryClient = readyToPlaceOrder(autoOrderItems)

    render(<FinalReview />, { queryClient })

    expect(screen.getByRole("heading", { name: "Auto orders" })).toBeInTheDocument()
    expect(screen.getByText("Every 30 days")).toBeInTheDocument()
  })

  it("explains that card payments are unavailable without a Stripe key", async () => {
    vi.resetModules()
    const previousKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = ""
    const { default: FinalReviewWithoutKey } = await import("./FinalReview")

    render(<FinalReviewWithoutKey />)

    expect(screen.getByText(/Stripe publishable key is missing/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Place Order/ })).not.toBeInTheDocument()

    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = previousKey
  })
})
