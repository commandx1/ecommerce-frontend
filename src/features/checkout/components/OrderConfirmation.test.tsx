import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeAutoOrder } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import OrderConfirmation from "./OrderConfirmation"

const orderResult = (overrides: Record<string, unknown> = {}) => ({
  orderId: "order-1",
  totalPrice: 1234.5,
  status: "PAYMENT_SUCCESS",
  paymentStatus: "succeeded",
  createdDate: "2026-08-22T10:00:00Z",
  orderItems: [],
  ...overrides,
})

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("OrderConfirmation", () => {
  it("confirms the order with its id, status and total", () => {
    useCheckoutStore.setState({ currentStep: 5, orderResult: orderResult() as never })

    render(<OrderConfirmation />)

    expect(screen.getByText("Succeeded")).toBeInTheDocument()
    expect(screen.getByText("$1,234.50")).toBeInTheDocument()
  })

  it("flags a payment that is still pending rather than claiming success", () => {
    useCheckoutStore.setState({
      currentStep: 5,
      orderResult: orderResult({ status: "PENDING_PAYMENT", paymentStatus: "requires_action" }) as never,
    })

    render(<OrderConfirmation />)

    expect(screen.getByText("Requires Action")).toBeInTheDocument()
    expect(screen.queryByText("Succeeded")).not.toBeInTheDocument()
  })

  it("still renders the actions when no order result made it into the store", () => {
    useCheckoutStore.setState({ currentStep: 5, orderResult: null })

    render(<OrderConfirmation />)

    expect(screen.getByRole("link", { name: /View Orders/ })).toHaveAttribute("href", "/buyer-dashboard/orders")
    expect(screen.queryByText("Payment Status")).not.toBeInTheDocument()
  })

  it("clears the cart, resets checkout and returns home on Continue Shopping", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 5, orderResult: orderResult() as never })
    useCartStore.setState({ cartId: "cart-1" })

    const { router } = render(<OrderConfirmation />)

    await user.click(screen.getByRole("button", { name: /Continue Shopping/ }))

    expect(router.push).toHaveBeenCalledWith("/")
    await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(1))
  })

  it("waits for the auto order schedules to appear before confirming them", async () => {
    // The poll starts after a 3s timeout; only timers are faked so MSW/axios keep working.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    useCheckoutStore.setState({
      currentStep: 5,
      orderResult: orderResult() as never,
      autoOrderUserProductIds: ["up-auto"],
    })
    server.use(
      http.get("*/backend-api/auto-orders", () =>
        HttpResponse.json({ autoOrders: [makeAutoOrder({ userProductId: "up-auto" })], total: 1 }),
      ),
    )

    render(<OrderConfirmation />)

    expect(screen.getByText("Setting up automatic reordering for 1 item…")).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(3000)
    vi.useRealTimers()

    expect(await screen.findByText("1 item will be reordered automatically.")).toBeInTheDocument()
  })

  it("says nothing about repeat orders when the order had none", () => {
    useCheckoutStore.setState({ currentStep: 5, orderResult: orderResult() as never, autoOrderUserProductIds: [] })

    render(<OrderConfirmation />)

    expect(screen.queryByText(/reordered automatically/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Setting up automatic reordering/)).not.toBeInTheDocument()
  })
})
