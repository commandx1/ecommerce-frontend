import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Cart } from "@/lib/api/cart"
import { server } from "@/mocks/server"
import { makeCart, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor, within } from "@/test/render"
import CartPage from "./CartPage"

installRadixPointerPolyfills()

interface CartWrite {
  userProductId: string
  quantity: number
  autoOrder: string | null
}

let cartResponse: Cart
let writes: CartWrite[]
let cartDeletes: number

const installHandlers = () => {
  server.use(
    http.get("*/backend-api/cart", () => HttpResponse.json(cartResponse)),
    http.put("*/backend-api/cart/items", async ({ request }) => {
      writes.push((await request.json()) as CartWrite)
      return new HttpResponse(null, { status: 200 })
    }),
    http.delete("*/backend-api/cart", () => {
      cartDeletes += 1
      cartResponse = makeCart({ cartItems: [] })
      return new HttpResponse(null, { status: 200 })
    }),
  )
}

/**
 * `CartLoadingState`, `CartEmptyState` and `CartContent` all render their own "Shopping Cart"
 * H1, so `await screen.findByRole(...)` (find, THEN assert) can resolve against the transient
 * loading/empty heading and, by the time `.toBeInTheDocument()` runs a tick later, that node has
 * already been unmounted in favour of `CartContent`'s own H1 - a stale-node race, not a real
 * "not found". Query AND assert inside the same `waitFor` poll instead (no gap for a re-render to
 * land in), and match on `CartContent`'s "Cart Items (N)" heading, which only the ready view ever
 * renders.
 */
const waitForCartReady = async () => {
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: /^Cart Items/ })).toBeInTheDocument()
  })
}

describe("CartPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    writes = []
    cartDeletes = 0
    cartResponse = makeCart()
    installHandlers()
  })

  it("shows the empty state and routes back to the storefront", async () => {
    const user = userEvent.setup()
    cartResponse = makeCart({ cartItems: [] })
    const { router } = render(<CartPage />)

    await user.click(await screen.findByRole("button", { name: "Continue Shopping" }))

    expect(router.push).toHaveBeenCalledWith("/")
  })

  it("groups the loaded lines under their seller and totals them", async () => {
    cartResponse = makeCart({
      cartItems: [
        makeCartItem({
          id: "ci-1",
          quantity: 2,
          userProduct: makeCartUserProduct({
            userProductId: "up-1",
            price: 100,
            shipmentFee: 5,
            sellerName: "Acme Dental",
          }),
        }),
        makeCartItem({
          id: "ci-2",
          quantity: 1,
          product: makeCartProductInfo({ id: "p-2", name: "Curing Light" }),
          userProduct: makeCartUserProduct({
            userProductId: "up-2",
            price: 50,
            shipmentFee: 0,
            sellerId: "seller-2",
            sellerName: "Beta Supplies",
          }),
        }),
      ],
    })
    render(<CartPage />)
    await waitForCartReady()

    expect(screen.getByRole("heading", { name: "Cart Items (2)" })).toBeInTheDocument()
    expect(screen.getByText("Acme Dental")).toBeInTheDocument()
    expect(screen.getByText("Beta Supplies")).toBeInTheDocument()
    expect(screen.getByText("Subtotal (3 items)")).toBeInTheDocument()
    expect(screen.getByText("$250.00")).toBeInTheDocument()
  })

  // Regression guard for the a11y-smoke FINDING "heading level skip(s) on
  // /cart: [ 'h2 -> h4 at position 2' ]": the per-seller "Shipping from"
  // heading sits directly under the h2 "Cart Items (N)" heading, so it must
  // be an h3, not an h4 (which skipped a level and outranked the h3 item
  // titles nested inside it).
  it("keeps the per-seller heading one level below Cart Items, with no level skip", async () => {
    cartResponse = makeCart({
      cartItems: [
        makeCartItem({
          id: "ci-1",
          userProduct: makeCartUserProduct({ userProductId: "up-1", sellerName: "Acme Dental" }),
        }),
      ],
    })
    render(<CartPage />)
    await waitForCartReady()

    expect(screen.getByRole("heading", { level: 3, name: /Shipping from:\s*Acme Dental/ })).toBeInTheDocument()
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0)
  })

  it("falls back to a generic seller label when the line carries no seller", async () => {
    cartResponse = makeCart({
      cartItems: [makeCartItem({ userProduct: makeCartUserProduct({ sellerId: "", sellerName: "" }) })],
    })
    render(<CartPage />)
    await waitForCartReady()

    expect(screen.getByText("Standard Seller")).toBeInTheDocument()
  })

  it("collapses rapid quantity clicks into one write carrying the final value", async () => {
    const user = userEvent.setup()
    render(<CartPage />)
    await waitForCartReady()

    const increase = screen.getByRole("button", { name: "Increase quantity" })
    await user.click(increase)
    await user.click(increase)

    expect(await screen.findByText("4")).toBeInTheDocument()
    await waitFor(() => expect(writes).toHaveLength(1), { timeout: 3000 })
    expect(writes[0]).toEqual({ userProductId: "up-1", quantity: 4, autoOrder: null })
  })

  // Quantity and schedule share one endpoint, so switching the schedule on while a quantity edit
  // is still debounced must flush the pending quantity into that single write.
  it("flushes a still-debounced quantity into the auto-order write", async () => {
    const user = userEvent.setup()
    render(<CartPage />)
    await waitForCartReady()

    await user.click(screen.getByRole("button", { name: "Increase quantity" }))
    await user.click(screen.getByRole("checkbox", { name: /Auto-reorder this item/i }))

    await waitFor(() => expect(writes).toHaveLength(1), { timeout: 3000 })
    expect(writes[0]).toEqual({ userProductId: "up-1", quantity: 3, autoOrder: "ONE_MONTH" })
  })

  it("empties the cart only after the confirmation is accepted", async () => {
    const user = userEvent.setup()
    render(<CartPage />)
    await waitForCartReady()

    await user.click(screen.getByRole("button", { name: /Clear cart/i }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(cartDeletes).toBe(0)

    await user.click(screen.getByRole("button", { name: /Clear cart/i }))
    // Both the toolbar action and the modal's confirm button read "Clear cart"; the confirm one
    // lives inside the dialog.
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Clear cart" }))

    await waitFor(() => expect(cartDeletes).toBe(1))
    expect(await screen.findByText("Your Cart is Empty")).toBeInTheDocument()
  })

  it("refuses checkout and keeps the user on the cart while a line is unavailable", async () => {
    const user = userEvent.setup()
    cartResponse = makeCart({
      cartItems: [makeCartItem({ userProduct: makeCartUserProduct({ stockAlert: "Out of stock" }) })],
    })
    const { router } = render(<CartPage />)
    await waitForCartReady()

    expect(await screen.findByText("Checkout is blocked")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Proceed to Checkout/i }))

    expect(router.push).not.toHaveBeenCalledWith("/checkout")
  })

  it("navigates to checkout when nothing blocks the cart", async () => {
    const user = userEvent.setup()
    const { router } = render(<CartPage />)
    await waitForCartReady()

    await user.click(screen.getByRole("button", { name: /Proceed to Checkout/i }))

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/checkout"))
  })

  it("removes a line and returns to the empty state", async () => {
    const user = userEvent.setup()
    let removed: unknown = null
    server.use(
      http.delete("*/backend-api/cart/items", async ({ request }) => {
        removed = await request.json()
        cartResponse = makeCart({ cartItems: [] })
        return new HttpResponse(null, { status: 200 })
      }),
    )
    render(<CartPage />)
    await waitForCartReady()

    await user.click(screen.getByRole("button", { name: "Remove item" }))

    expect(await screen.findByText("Your Cart is Empty")).toBeInTheDocument()
    expect(removed).toEqual({ userProductId: "up-1" })
  })
})
