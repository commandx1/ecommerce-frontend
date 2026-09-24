import { act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { seedCart } from "@/test/cart"
import { makeAddress, makeCart, makeCartItem } from "@/test/factories"
import { createTestQueryClient, render, screen, waitFor } from "@/test/render"
import CheckoutPage from "./CheckoutPage"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

/**
 * `src/lib/api/address.ts` and `src/lib/api/shipment.ts` both memoise responses in module scope
 * with no reset hook. Faking "now" forward per test keeps one test's data out of the next.
 */
let clockOffset = 0

beforeEach(() => {
  vi.restoreAllMocks()
  clockOffset += 60_000
  const realNow = Date.now.bind(Date)
  vi.spyOn(Date, "now").mockImplementation(() => realNow() + clockOffset)
  window.localStorage.clear()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  server.use(
    http.get("*/backend-api/cart", () => HttpResponse.json(makeCart({ cartItems: [makeCartItem()] }))),
    http.get("*/backend-api/address", () => HttpResponse.json([makeAddress({ id: "addr-1", title: "Clinic" })])),
  )
})

describe("CheckoutPage", () => {
  it("sends a buyer with an empty cart back to the cart page", async () => {
    server.use(http.get("*/backend-api/cart", () => HttpResponse.json(makeCart({ cartItems: [] }))))
    useCheckoutStore.setState({ currentStep: 2 })

    const { router } = render(<CheckoutPage />)

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cart"))
  })

  it("renders the shipping step with the buyer's single address, not a picker", async () => {
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    expect(await screen.findByRole("heading", { name: "Shipping Address" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { name: "Clinic" }).length).toBeGreaterThan(0)
    expect(
      screen.queryAllByRole("radio").filter((radio) => radio.getAttribute("name") === "shippingAddress"),
    ).toHaveLength(0)
  })

  it("shows only the primary address when older records left more than one behind", async () => {
    server.use(
      http.get("*/backend-api/address", () =>
        HttpResponse.json([
          makeAddress({ id: "addr-1", title: "Clinic", defaultAddress: false }),
          makeAddress({ id: "addr-2", title: "Warehouse", defaultAddress: true }),
        ]),
      ),
    )
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    expect((await screen.findAllByRole("heading", { name: "Warehouse" })).length).toBeGreaterThan(0)
    expect(screen.queryByRole("heading", { name: "Clinic" })).not.toBeInTheDocument()
  })

  it("shows the order summary on every step except the confirmation", async () => {
    useCheckoutStore.setState({ currentStep: 2 })
    render(<CheckoutPage />)

    expect(await screen.findByRole("heading", { name: "Order Summary" })).toBeInTheDocument()

    // Transition to the confirmation step while mounted, rather than cold-mounting at step 5,
    // which useCheckoutPage now treats as a stale confirmation and resets.
    act(() => {
      useCheckoutStore.setState({ currentStep: 5 })
    })

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Order Summary" })).not.toBeInTheDocument())
  })

  it("sends Continue Shopping to /products, never bouncing through /cart", async () => {
    // Mounts at step 4 and transitions to 5, mirroring how an order is actually placed while the
    // checkout page stays mounted. A cold mount at step 5 is treated as a stale confirmation and
    // reset instead (see useCheckoutPage.test.ts), so it would not reach this button at all.
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 4 })

    // Seed the cart query cache like a buyer arriving straight from /cart (already warm, just
    // past the 1s dedup window) - otherwise the reader's cold-mount fallback (`items: []`) trips
    // useCheckoutPage's empty-cart guard for one tick before the mount `GET /cart` resolves (the
    // same pre-existing characterization as useCheckoutPage.test.ts's "redirects while the cart
    // is still loading" case), and this test is about Continue Shopping, not that quirk.
    const queryClient = createTestQueryClient()
    seedCart(queryClient, makeCart({ cartItems: [makeCartItem()] }), { updatedAt: Date.now() - 2_000 })

    const { router } = render(<CheckoutPage />, { queryClient })

    act(() => {
      useCheckoutStore.setState({
        currentStep: 5,
        orderResult: {
          orderId: "order-1",
          totalPrice: 1234.5,
          status: "PAYMENT_SUCCESS",
          paymentStatus: "succeeded",
          createdDate: "2026-08-22T10:00:00Z",
          orderItems: [],
        } as never,
      })
      seedCart(queryClient, { cartItems: [] })
    })

    await user.click(await screen.findByRole("button", { name: /Continue Shopping/ }))

    expect(router.push).toHaveBeenCalledWith("/products")
    expect(router.push).not.toHaveBeenCalledWith("/cart")
  })

  it("shows no contact details at all until an address is picked", async () => {
    // Regression guard for K1: this used to render a hardcoded demo buyer
    // ("Michael Chen / Pacific Dental Group / 2847 Mission Street, San Francisco") that nothing
    // about the signed-in buyer produced. An empty form is the honest state - better a blank
    // summary than a stranger's address the buyer might not notice before ordering.
    useCheckoutStore.setState({ currentStep: 3 })

    render(<CheckoutPage />)

    await screen.findByRole("heading", { name: "Order Summary" })
    expect(screen.queryByText("Pacific Dental Group")).not.toBeInTheDocument()
    expect(screen.queryByText(/2847 Mission Street/)).not.toBeInTheDocument()
    expect(screen.queryByText("(415) 555-0123")).not.toBeInTheDocument()
  })

  it("fills the address in once the buyer selects a real one", async () => {
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    await screen.findAllByRole("heading", { name: "Clinic" })
    await waitFor(() => expect(useCheckoutStore.getState().shippingAddress.company).toBe("Clinic"))
    expect(screen.queryByText("Pacific Dental Group")).not.toBeInTheDocument()
  })

  it("blocks Continue to Billing until an address is selected", async () => {
    server.use(http.get("*/backend-api/address", () => HttpResponse.json([])))
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    expect(await screen.findByText("No addresses found in your account.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Continue to Billing/ })).toBeDisabled()
  })

  it("routes 'Edit Address' to the buyer's address book", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 2 })

    const { router } = render(<CheckoutPage />)

    await user.click(await screen.findByRole("button", { name: /Edit Address/ }))

    expect(router.push).toHaveBeenCalledWith("/buyer-dashboard/settings")
  })

  it("advances to billing once an address is chosen", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    await screen.findAllByRole("heading", { name: "Clinic" })
    await user.click(screen.getByRole("button", { name: /Continue to Billing/ }))

    await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(3))
  })

  it("warns about repeat deliveries when the account has no primary address at all", async () => {
    // The buyer can no longer pick a non-primary address here, so the only way this order can ship
    // somewhere the auto order scheduler will not follow is an account whose records never marked
    // one address as primary.
    server.use(
      http.get("*/backend-api/cart", () =>
        HttpResponse.json(makeCart({ cartItems: [makeCartItem({ autoOrder: "ONE_MONTH" })] })),
      ),
      http.get("*/backend-api/address", () =>
        HttpResponse.json([makeAddress({ id: "addr-1", title: "Clinic", defaultAddress: false })]),
      ),
    )
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    expect(await screen.findByText("Auto order deliveries use your primary address")).toBeInTheDocument()
  })

  it("stays quiet about repeat deliveries when the shown address is the primary one", async () => {
    server.use(
      http.get("*/backend-api/cart", () =>
        HttpResponse.json(makeCart({ cartItems: [makeCartItem({ autoOrder: "ONE_MONTH" })] })),
      ),
      http.get("*/backend-api/address", () =>
        HttpResponse.json([makeAddress({ id: "addr-1", title: "Clinic", defaultAddress: true })]),
      ),
    )
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    await screen.findAllByRole("heading", { name: "Clinic" })
    expect(screen.queryByText("Auto order deliveries use your primary address")).not.toBeInTheDocument()
  })
})
