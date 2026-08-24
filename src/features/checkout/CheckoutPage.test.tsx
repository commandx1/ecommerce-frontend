import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeAddress, makeCart, makeCartItem } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
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

  it("renders the shipping step with the buyer's saved addresses", async () => {
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    expect(await screen.findByRole("heading", { name: "Select Shipping Address" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { name: "Clinic" }).length).toBeGreaterThan(0)
    const addressRadios = screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("name") === "shippingAddress")
    expect(addressRadios).toHaveLength(1)
    expect(addressRadios[0]).toBeChecked()
  })

  it("shows the order summary on every step except the confirmation", async () => {
    useCheckoutStore.setState({ currentStep: 2 })
    const shipping = render(<CheckoutPage />)

    expect(await screen.findByRole("heading", { name: "Order Summary" })).toBeInTheDocument()
    shipping.unmount()

    useCheckoutStore.setState({ currentStep: 5 })
    render(<CheckoutPage />)

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Order Summary" })).not.toBeInTheDocument())
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

  it("routes 'Add New Address' to the buyer's address book", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 2 })

    const { router } = render(<CheckoutPage />)

    await user.click(await screen.findByRole("button", { name: /Add New Address/ }))

    expect(router.push).toHaveBeenCalledWith("/buyer-dashboard/settings/addresses")
  })

  it("advances to billing once an address is chosen", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 2 })

    render(<CheckoutPage />)

    await screen.findAllByRole("heading", { name: "Clinic" })
    await user.click(screen.getByRole("button", { name: /Continue to Billing/ }))

    await waitFor(() => expect(useCheckoutStore.getState().currentStep).toBe(3))
  })

  it("warns that repeat deliveries ignore a non-primary address", async () => {
    server.use(
      http.get("*/backend-api/cart", () =>
        HttpResponse.json(makeCart({ cartItems: [makeCartItem({ autoOrder: "ONE_MONTH" })] })),
      ),
      http.get("*/backend-api/address", () =>
        HttpResponse.json([
          makeAddress({ id: "addr-1", title: "Clinic", defaultAddress: false }),
          makeAddress({ id: "addr-2", title: "Home", defaultAddress: true }),
        ]),
      ),
    )
    useCheckoutStore.setState({ currentStep: 2 })
    const user = userEvent.setup()

    render(<CheckoutPage />)

    await screen.findAllByRole("heading", { name: "Clinic" })
    expect(screen.queryByText("Repeat deliveries use your primary address")).not.toBeInTheDocument()

    await user.click(screen.getAllByRole("radio")[0] as HTMLElement)

    expect(await screen.findByText("Repeat deliveries use your primary address")).toBeInTheDocument()
  })
})
