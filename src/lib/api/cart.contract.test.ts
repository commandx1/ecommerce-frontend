import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { makeCart, makeCartItem, makeCartUserProduct, makeTaxEstimate } from "@/test/factories"
import { cartAPI } from "./cart"

const cartWithSchedule = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })

let capturedPutBody: Record<string, unknown> | null = null
let capturedPostBody: Record<string, unknown> | null = null

/**
 * These handlers capture the outgoing request bodies so the assertions below can pin the exact
 * wire contract. They are registered per test because the global setup resets handlers after
 * every test case.
 */
beforeEach(() => {
  capturedPutBody = null
  capturedPostBody = null

  server.use(
    http.get("*/backend-api/cart", () => HttpResponse.json(cartWithSchedule)),
    http.put("*/backend-api/cart/items", async ({ request }) => {
      capturedPutBody = (await request.json()) as Record<string, unknown>
      return new HttpResponse(null, { status: 200 })
    }),
    http.post("*/backend-api/cart/items", async ({ request }) => {
      capturedPostBody = (await request.json()) as Record<string, unknown>
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

describe("cartAPI auto order contract", () => {
  it("always sends autoOrder, defaulting to null", async () => {
    await cartAPI.updateItemQuantity("up-1", 3)
    expect(capturedPutBody).toEqual({ userProductId: "up-1", quantity: 3, autoOrder: null })

    await cartAPI.addItem("up-1", 1)
    expect(capturedPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: null })
  })

  it("sends the schedule when one is given", async () => {
    await cartAPI.updateItemQuantity("up-1", 3, "ONE_MONTH")
    expect(capturedPutBody).toEqual({ userProductId: "up-1", quantity: 3, autoOrder: "ONE_MONTH" })
  })
})

describe("cartStore auto order preservation", () => {
  it("keeps the existing schedule when only the quantity changes", async () => {
    await useCartStore.getState().fetchCart({ force: true })
    expect(useCartStore.getState().items[0]?.autoOrder).toBe("TWO_WEEKS")

    await useCartStore.getState().updateQuantity("up-1", 5)

    // The backend replaces auto_order on every write, so a quantity-only edit
    // must resend the schedule rather than dropping it.
    expect(capturedPutBody).toEqual({ userProductId: "up-1", quantity: 5, autoOrder: "TWO_WEEKS" })
  })

  it("keeps the existing schedule when the same product is added again", async () => {
    await useCartStore.getState().fetchCart({ force: true })

    await useCartStore.getState().addToCart("up-1", 1)

    expect(capturedPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: "TWO_WEEKS" })
  })

  it("clears the schedule when null is passed explicitly", async () => {
    await useCartStore.getState().fetchCart({ force: true })

    await useCartStore.getState().setItemAutoOrder("up-1", null)

    expect(capturedPutBody).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: null })
  })

  it("writes the schedule with a flushed quantity in a single request", async () => {
    await useCartStore.getState().fetchCart({ force: true })

    await useCartStore.getState().setItemAutoOrder("up-1", "TWO_MONTHS", 7)

    expect(capturedPutBody).toEqual({ userProductId: "up-1", quantity: 7, autoOrder: "TWO_MONTHS" })
  })
})

describe("cartAPI request shapes", () => {
  it("keeps autoOrder: null as an explicit JSON null instead of dropping the key", async () => {
    let rawBody: string | null = null
    server.use(
      http.post("*/backend-api/cart/items", async ({ request }) => {
        rawBody = await request.text()
        return new HttpResponse(null, { status: 200 })
      }),
    )

    await cartAPI.addItem("up-1", 1, null)

    // `undefined` would be stripped by JSON.stringify and the backend would keep the old
    // schedule; the wire payload must carry a literal null.
    expect(rawBody).toContain('"autoOrder":null')
    expect(JSON.parse(rawBody ?? "{}")).toHaveProperty("autoOrder", null)
  })

  it("sends the delete target in the request body, not the url", async () => {
    let capturedDeleteBody: unknown = null
    let capturedDeletePath: string | null = null
    server.use(
      http.delete("*/backend-api/cart/items", async ({ request }) => {
        capturedDeletePath = new URL(request.url).pathname
        capturedDeleteBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await cartAPI.removeItem("up-9")

    expect(capturedDeletePath).toBe("/backend-api/cart/items")
    expect(capturedDeleteBody).toEqual({ userProductId: "up-9" })
  })

  it("sends the cart id in the body when clearing the cart", async () => {
    let capturedClearBody: unknown = null
    server.use(
      http.delete("*/backend-api/cart", async ({ request }) => {
        capturedClearBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await cartAPI.clearCart("cart-1")

    expect(capturedClearBody).toEqual({ cartId: "cart-1" })
  })
})

describe("cartAPI.getCart contract", () => {
  it("returns the typed cart with numeric price fields", async () => {
    const cart = await cartAPI.getCart()

    expect(cart.cartId).toBe(cartWithSchedule.cartId)
    expect(cart.cartItems).toHaveLength(1)

    const item = cart.cartItems[0]
    expect(item?.autoOrder).toBe("TWO_WEEKS")
    expect(typeof item?.quantity).toBe("number")
    expect(typeof item?.userProduct.price).toBe("number")
    expect(typeof item?.userProduct.shipmentFee).toBe("number")
    expect(typeof item?.userProduct.heavyShippingSurcharge).toBe("number")
    expect(typeof item?.userProduct.stock).toBe("number")
  })

  it("returns an empty cart as an empty item array", async () => {
    server.use(http.get("*/backend-api/cart", () => HttpResponse.json(makeCart({ cartItems: [] }))))

    await expect(cartAPI.getCart()).resolves.toMatchObject({ cartItems: [] })
  })

  it("tolerates null alert fields on the item", async () => {
    server.use(
      http.get("*/backend-api/cart", () =>
        HttpResponse.json(
          makeCart({
            cartItems: [
              makeCartItem({
                userProduct: makeCartUserProduct({ stockAlert: null, userProductAlert: null }),
              }),
            ],
          }),
        ),
      ),
    )

    const cart = await cartAPI.getCart()

    expect(cart.cartItems[0]?.userProduct.stockAlert).toBeNull()
    expect(cart.cartItems[0]?.userProduct.userProductAlert).toBeNull()
    expect(cart.cartItems[0]?.autoOrder).toBeNull()
  })

  it("flags a 401 as auth-handled", async () => {
    server.use(http.get("*/backend-api/cart", () => HttpResponse.json({ message: "Expired" }, { status: 401 })))

    const error = await cartAPI.getCart().catch((caught: unknown) => caught)

    expect((error as { authHandled?: boolean }).authHandled).toBe(true)
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/cart", () => HttpResponse.error()))

    await expect(cartAPI.getCart()).rejects.toThrow()
  })
})

describe("cartAPI.getTaxEstimate contract", () => {
  it("sends the shipping amount as a string and returns numeric money fields", async () => {
    let capturedTaxBody: unknown = null
    server.use(
      http.post("*/backend-api/cart/tax-estimate", async ({ request }) => {
        capturedTaxBody = await request.json()
        return HttpResponse.json(makeTaxEstimate())
      }),
    )

    const estimate = await cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: "10.00" })

    // `shippingAmount` crosses the wire as a decimal string to avoid float rounding.
    expect(capturedTaxBody).toEqual({ addressId: "addr-1", shippingAmount: "10.00" })
    expect(typeof estimate.subtotal).toBe("number")
    expect(typeof estimate.taxAmount).toBe("number")
    expect(estimate.taxAmount).toBe(8.5)
    expect(estimate.totalAmount).toBe(118.5)
    expect(estimate.currency).toBe("USD")
  })

  it("returns a zero tax estimate for an exempt buyer", async () => {
    server.use(
      http.post("*/backend-api/cart/tax-estimate", () =>
        HttpResponse.json(makeTaxEstimate({ taxAmount: 0, totalAmount: 110 })),
      ),
    )

    const estimate = await cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: "10" })

    // Tax exemption is resolved entirely on the backend — the request carries no exemption flag.
    expect(estimate.taxAmount).toBe(0)
    expect(estimate.totalAmount).toBe(110)
  })

  it.each([
    [400, "Shipping amount is invalid"],
    [404, "Address not found"],
    [500, "Tax provider unavailable"],
  ])("rejects on %i", async (status, message) => {
    server.use(http.post("*/backend-api/cart/tax-estimate", () => HttpResponse.json({ message }, { status })))

    await expect(cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: "10" })).rejects.toMatchObject({
      response: { status, data: { message } },
    })
  })
})

describe("cartAPI write error paths", () => {
  it("rejects with 409 when the requested quantity exceeds stock", async () => {
    server.use(
      http.put("*/backend-api/cart/items", () =>
        HttpResponse.json({ message: "Only 3 left in stock" }, { status: 409 }),
      ),
    )

    await expect(cartAPI.updateItemQuantity("up-1", 99)).rejects.toMatchObject({
      response: { status: 409, data: { message: "Only 3 left in stock" } },
    })
  })

  it("rejects with 403 when the buyer lacks the required dental license", async () => {
    server.use(
      http.post("*/backend-api/cart/items", () =>
        HttpResponse.json({ message: "A dental license is required for this product" }, { status: 403 }),
      ),
    )

    const error = await cartAPI.addItem("up-1", 1).catch((caught: unknown) => caught)

    expect((error as { response?: { status?: number } }).response?.status).toBe(403)
    // 403 is a business-rule rejection, so the session is left intact.
    expect((error as { authHandled?: boolean }).authHandled).toBeUndefined()
  })

  it("rejects with 404 when removing an item that is no longer in the cart", async () => {
    server.use(
      http.delete("*/backend-api/cart/items", () => HttpResponse.json({ message: "Not in cart" }, { status: 404 })),
    )

    await expect(cartAPI.removeItem("up-gone")).rejects.toMatchObject({ response: { status: 404 } })
  })

  it("rejects on a network failure while writing", async () => {
    server.use(http.put("*/backend-api/cart/items", () => HttpResponse.error()))

    await expect(cartAPI.updateItemQuantity("up-1", 2)).rejects.toThrow()
  })
})
