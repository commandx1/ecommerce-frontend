import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
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

  it("clears the cart, resets checkout and opens product listing on Continue Shopping", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 5, orderResult: orderResult() as never })
    useCartStore.setState({ cartId: "cart-1" })

    const { router } = render(<OrderConfirmation />)

    await user.click(screen.getByRole("button", { name: /Continue Shopping/ }))

    expect(router.push).toHaveBeenCalledWith("/products")
    await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(1))
  })

  it("shows an Auto order badge and its schedule for a line placed on repeat", () => {
    useCheckoutStore.setState({
      currentStep: 5,
      orderResult: orderResult({
        orderItems: [
          {
            id: "item-auto",
            userProductId: "up-auto",
            productId: "product-auto",
            productName: "Composite Kit",
            productCoverPhotoPath: "/uploads/composite-kit.png",
            price: 42.5,
            quantity: 1,
            status: "PROCESSING",
            shippingLink: [],
            trackingLink: [],
            updatedDate: null,
          },
        ],
      }) as never,
      autoOrderUserProductIds: ["up-auto"],
      orderPayload: {
        addressId: "address-1",
        shippoRateOrders: [
          {
            shippoRateId: "rate-1",
            products: [{ userProductId: "up-auto", quantity: 1, autoOrder: "ONE_MONTH" }],
          },
        ],
        uberRateOrders: [],
      } as never,
    })

    render(<OrderConfirmation />)

    // The schedule is read off the payload that was actually sent, so it is named immediately —
    // the buyer never has to wait on the auto-order poll to see what they signed up for.
    expect(screen.getByText("Auto order")).toBeInTheDocument()
    expect(screen.getByText("Every 30 days")).toBeInTheDocument()
  })

  it("says nothing about repeat orders when the order had none", () => {
    useCheckoutStore.setState({
      currentStep: 5,
      orderResult: orderResult({
        orderItems: [
          {
            id: "item-1",
            userProductId: "up-1",
            productId: "product-1",
            productName: "Composite Kit",
            productCoverPhotoPath: "/uploads/composite-kit.png",
            price: 42.5,
            quantity: 1,
            status: "PROCESSING",
            shippingLink: [],
            trackingLink: [],
            updatedDate: null,
          },
        ],
      }) as never,
      autoOrderUserProductIds: [],
    })

    render(<OrderConfirmation />)

    expect(screen.queryByText("Auto order")).not.toBeInTheDocument()
  })
})
