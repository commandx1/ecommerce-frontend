import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { render, screen, waitFor, within } from "@/test/render"
import type { SupplierViewModel } from "../types"
import PurchaseOptions from "./PurchaseOptions"

const mockToastError = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const makeSupplier = (overrides: Partial<SupplierViewModel> = {}): SupplierViewModel => ({
  id: 1,
  userProductId: "up-1",
  name: "Acme Dental",
  alt: "Acme Dental logo",
  badge: "Verified",
  price: "$56.00",
  originalPrice: "$70.00",
  discount: 20,
  stock: "In Stock",
  stockColor: "green",
  stockCount: 40,
  shipping: "$5.00",
  shippingNote: "Standard",
  shippingFee: "$5.00",
  heavyShippingFee: "$0.00",
  rating: 4.5,
  reviewCount: 12,
  ...overrides,
})

const bulkPricing = [
  { id: 1, range: "1-9", price: "$56.00", note: "Standard", selected: true },
  { id: 2, range: "10-49", price: "$50.00", note: "Save 10%", selected: false },
  { id: 3, range: "50+", price: "$45.00", note: "Save 20%", selected: false },
]

const orderSummary = {
  product: "Intra Oral Mixing Tips",
  productPrice: "$56.00",
  warranty: "$0.00",
  shipping: "$5.00",
  subtotal: "$56.00",
  tax: "$4.62",
  total: "$65.62",
}

type Props = Parameters<typeof PurchaseOptions>[0]

const renderPurchase = (overrides: Partial<Props> = {}, searchParams = "") =>
  render(
    <PurchaseOptions
      bulkPricing={bulkPricing}
      warrantyOptions={[]}
      orderSummary={orderSummary}
      suppliers={[makeSupplier()]}
      bestPriceVendorUserProductId="up-1"
      {...overrides}
    />,
    { route: "/products/p-1", searchParams },
  )

const quantityBox = () => screen.getByLabelText("Quantity")
/** The +/- stepper buttons carry only an icon, so they are identified by their empty accessible name. */
const stepperButtons = () => screen.getAllByRole("button").filter((button) => button.textContent === "")

describe("PurchaseOptions", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastError.mockClear()
  })

  it("starts at a single unit and reports the supplier's stock", () => {
    renderPurchase()

    expect(quantityBox()).toHaveValue("1")
    expect(screen.getByText("Units available: 40")).toBeInTheDocument()
  })

  it("cannot go below one unit", () => {
    renderPurchase()

    const [decrement] = stepperButtons()
    expect(decrement).toBeDisabled()
    expect(quantityBox()).toHaveValue("1")
  })

  it("stops incrementing at the supplier's stock count", async () => {
    const user = userEvent.setup()
    renderPurchase({ suppliers: [makeSupplier({ stockCount: 2 })] })

    const [decrement, increment] = stepperButtons()
    await user.click(increment)
    expect(quantityBox()).toHaveValue("2")

    expect(increment).toBeDisabled()
    expect(decrement).toBeEnabled()
  })

  it("moves the highlighted bulk tier as the quantity crosses a threshold", async () => {
    const user = userEvent.setup()
    renderPurchase()

    const increment = stepperButtons()[1]
    for (let click = 0; click < 9; click += 1) {
      await user.click(increment)
    }

    expect(quantityBox()).toHaveValue("10")
    expect(screen.getByText("Save 10%")).toBeInTheDocument()
  })

  it("prefers the supplier named by the vendorId query parameter", () => {
    renderPurchase(
      {
        suppliers: [makeSupplier(), makeSupplier({ id: 2, userProductId: "up-2", stockCount: 7 })],
      },
      "vendorId=up-2",
    )

    expect(screen.getByText("Units available: 7")).toBeInTheDocument()
  })

  it("falls back to the best-price supplier when the URL names an unknown vendor", () => {
    renderPurchase(
      {
        suppliers: [makeSupplier({ stockCount: 40 }), makeSupplier({ id: 2, userProductId: "up-2", stockCount: 7 })],
      },
      "vendorId=up-does-not-exist",
    )

    expect(screen.getByText("Units available: 40")).toBeInTheDocument()
  })

  it("adds the selected supplier's listing and quantity to the cart", async () => {
    const user = userEvent.setup()
    let body: unknown = null
    server.use(
      http.post("*/backend-api/cart/items", async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
      http.get("*/backend-api/cart", () => HttpResponse.json({ cartId: "cart-1", cartItems: [] })),
    )
    renderPurchase({}, "vendorId=up-1")

    const increment = stepperButtons()[1]
    await user.click(increment)
    await user.click(screen.getByRole("button", { name: /Add to Cart/i }))

    await waitFor(() => expect(body).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: null }))
  })

  // The axios interceptor stamps 401s as "auth handled" and performs the redirect itself, so the
  // component's own `router.push("/login")` branch is unreachable — the same dead-code pattern
  // TEST-FINDINGS already records for `addToCart`.
  it("leaves an unauthorised cart write to the interceptor's redirect", async () => {
    const user = userEvent.setup()
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))
    const { router } = renderPurchase()

    await user.click(screen.getByRole("button", { name: /Add to Cart/i }))

    await waitFor(() => expect(window.location.assign).toHaveBeenCalled())
    expect(String((window.location.assign as unknown as { mock: { calls: string[][] } }).mock.calls[0][0])).toContain(
      "/login",
    )
    expect(router.push).not.toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  // REGRESSION GUARD (K11): `cartStore.addToCart` used to swallow non-auth failures, so this
  // component's catch block never ran — a 500 left the shopper with a button that finished its
  // spinner and said nothing while the item was not in the cart. It now rethrows.
  it("warns the shopper when the cart write fails with a 500", async () => {
    const user = userEvent.setup()
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))
    const { router } = renderPurchase()

    await user.click(screen.getByRole("button", { name: /Add to Cart/i }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Failed to add to cart. Please try again."))
    await waitFor(() => expect(screen.getByRole("button", { name: /Add to Cart/i })).toBeEnabled())
    expect(router.push).not.toHaveBeenCalled()
  })

  it("refuses to add anything when no supplier can be resolved", async () => {
    const user = userEvent.setup()
    renderPurchase({ suppliers: [], bestPriceVendorUserProductId: null })

    await user.click(screen.getByRole("button", { name: /Add to Cart/i }))

    expect(mockToastError).toHaveBeenCalledWith(
      "Selected supplier is unavailable right now. Please choose another supplier.",
    )
  })

  describe("out of stock", () => {
    it("disables both purchase buttons and relabels the cart action", () => {
      renderPurchase({ suppliers: [makeSupplier({ stockCount: 0 })] })

      expect(screen.getByRole("button", { name: /Out of Stock/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: /Buy Now/i })).toBeDisabled()
    })

    // BULGU (TEST-FINDINGS): with `stockCount === 0` the quantity still resolves to 1 because the
    // clamp uses `stockCount || 1`, so the summary prices a unit that cannot be bought.
    it("still shows a quantity of one for a zero-stock supplier (current behaviour)", () => {
      renderPurchase({ suppliers: [makeSupplier({ stockCount: 0 })] })

      expect(quantityBox()).toHaveValue("1")
      expect(screen.getByText("Units available: 0")).toBeInTheDocument()
    })
  })

  it("keeps the quote request available even when the item is out of stock", () => {
    renderPurchase({ suppliers: [makeSupplier({ stockCount: 0 })] })

    expect(screen.getByRole("button", { name: /Request Quote/i })).toBeEnabled()
  })

  it("prices the order line from the quantity and unit price", async () => {
    const user = userEvent.setup()
    renderPurchase()

    const increment = stepperButtons()[1]
    await user.click(increment)

    const summary = screen.getByText("Order Summary").closest("div")!
    expect(within(summary).getByText(/x 2/)).toBeInTheDocument()
  })
})
