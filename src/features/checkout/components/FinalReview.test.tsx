import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartUserProduct } from "@/test/factories"
import { createFakeStripe, stripeError } from "@/test/mocks/stripe"
import { render, screen, waitFor } from "@/test/render"

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

const readyToPlaceOrder = () => {
  useCartStore.setState({ cartId: "cart-1", items: [makeCartItem()] })
  useCheckoutStore.setState({
    currentStep: 4,
    paymentMethod: { type: "card" },
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
    readyToPlaceOrder()
    render(<FinalReview />)

    expect(screen.getByRole("heading", { name: "Final Review" })).toBeInTheDocument()
    expect(screen.getByText("Visa •••• 4242")).toBeInTheDocument()
    expect(screen.getByText("Ready to Place Order")).toBeInTheDocument()
  })

  it("blocks Place Order while no Stripe payment method has been captured", () => {
    readyToPlaceOrder()
    useCheckoutStore.setState({ paymentMethodId: "" })

    render(<FinalReview />)

    expect(screen.getByRole("button", { name: /Place Order/ })).toBeDisabled()
  })

  it("blocks Place Order while the Stripe SDK has not loaded", () => {
    readyToPlaceOrder()
    stripeRef.current = null as unknown as ReturnType<typeof createFakeStripe>

    render(<FinalReview />)

    expect(screen.getByRole("button", { name: /Place Order/ })).toBeDisabled()
  })

  it("places the order, confirms the card and advances to the confirmation step", async () => {
    const user = userEvent.setup()
    readyToPlaceOrder()

    render(<FinalReview />)

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
    readyToPlaceOrder()
    let releaseOrder: (() => void) | undefined
    server.use(
      http.post("*/backend-api/orders", async () => {
        await new Promise<void>((resolve) => {
          releaseOrder = resolve
        })
        return HttpResponse.json(orderResponse())
      }),
    )

    render(<FinalReview />)

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    const submitting = await screen.findByRole("button", { name: /Placing Order/ })
    expect(submitting).toBeDisabled()

    releaseOrder?.()
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
  })

  it("keeps the buyer on step 4 when the card is declined", async () => {
    const user = userEvent.setup()
    readyToPlaceOrder()
    stripeRef.current.confirmCardPayment.mockResolvedValue(stripeError("Your card was declined."))

    render(<FinalReview />)

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Your card was declined."))
    expect(useCheckoutStore.getState().currentStep).toBe(4)
    // NOTE: the decline is only announced through a toast — this screen renders no
    // `role="alert"` region, so an assistive-tech user gets no in-page error.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("does not double-submit while a placement is already running", async () => {
    const user = userEvent.setup()
    readyToPlaceOrder()
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

    render(<FinalReview />)

    const button = screen.getByRole("button", { name: /Place Order/ })
    await user.click(button)
    await user.click(button)

    releaseOrder?.()
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    expect(orderRequests).toBe(1)
  })

  it("records an unpaid order when the backend returns no client secret", async () => {
    const user = userEvent.setup()
    readyToPlaceOrder()
    server.use(http.post("*/backend-api/orders", () => HttpResponse.json(orderResponse({ clientSecret: undefined }))))

    render(<FinalReview />)

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith(expect.stringContaining("created but not paid")))
    expect(useCheckoutStore.getState().orderResult?.status).toBe("PENDING_PAYMENT")
    expect(useCheckoutStore.getState().currentStep).toBe(4)
  })

  it("surfaces the backend's own message when the order cannot be created", async () => {
    const user = userEvent.setup()
    readyToPlaceOrder()
    server.use(
      http.post("*/backend-api/orders", () =>
        HttpResponse.json({ message: "One of the items is out of stock." }, { status: 409 }),
      ),
    )

    render(<FinalReview />)

    await user.click(screen.getByRole("button", { name: /Place Order/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("One of the items is out of stock."))
    expect(stripeRef.current.confirmCardPayment).not.toHaveBeenCalled()
  })

  it("lists the repeat schedules the buyer is about to commit to", () => {
    readyToPlaceOrder()
    useCartStore.setState({
      items: [
        makeCartItem({
          autoOrder: "ONE_MONTH",
          userProduct: makeCartUserProduct({ userProductId: "up-auto" }),
        }),
      ],
    })

    render(<FinalReview />)

    expect(screen.getByRole("heading", { name: "Repeat orders" })).toBeInTheDocument()
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
