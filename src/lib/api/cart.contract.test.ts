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
  // Backend: CartTaxEstimateRequest.java:15-16 declares `shippingAmount` as `Double` (not a
  // string) with `@NotNull @PositiveOrZero`. Sending a string here used to work by accident when
  // the value happened to parse cleanly, but `String(NaN)` -> `"NaN"` and Jackson cannot bind
  // that onto a Double at all, so a bad caller-side computation turned into a guaranteed 400
  // instead of the estimate being skipped client-side. The wire payload must be a real number.
  it("sends the shipping amount as a number and returns numeric money fields", async () => {
    let capturedTaxBody: unknown = null
    server.use(
      http.post("*/backend-api/cart/tax-estimate", async ({ request }) => {
        capturedTaxBody = await request.json()
        return HttpResponse.json(makeTaxEstimate())
      }),
    )

    const estimate = await cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: 10 })

    expect(capturedTaxBody).toEqual({ addressId: "addr-1", shippingAmount: 10 })
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

    const estimate = await cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: 10 })

    // Tax exemption is resolved entirely on the backend — the request carries no exemption flag.
    expect(estimate.taxAmount).toBe(0)
    expect(estimate.totalAmount).toBe(110)
  })

  it("rejects on 400 with a field-error body when shippingAmount is negative", async () => {
    // CartTaxEstimateRequest.java:15-16 `@NotNull @PositiveOrZero Double shippingAmount` -- a bean
    // validation failure throws MethodArgumentNotValidException, which
    // GlobalExceptionHandler.handleValidationExceptions maps to 400 with a `{ field: message }`
    // map body, not the `{ message }` shape the cart package's own exception handler uses.
    server.use(
      http.post("*/backend-api/cart/tax-estimate", () =>
        HttpResponse.json({ shippingAmount: "must be greater than or equal to 0" }, { status: 400 }),
      ),
    )

    await expect(cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: -10 })).rejects.toMatchObject({
      response: { status: 400, data: { shippingAmount: "must be greater than or equal to 0" } },
    })
  })

  it("rejects on 403 when the address does not belong to the buyer", async () => {
    // CartService.java:227-229 `addressRepository.findByIdAndUserId(...).orElseThrow(() -> new
    // AddressAccessDeniedException(...))` -- CartExceptionHandler.java maps
    // AddressAccessDeniedException to 403, not 404.
    server.use(
      http.post("*/backend-api/cart/tax-estimate", () =>
        HttpResponse.json({ message: "Address not found or does not belong to the user: addr-1" }, { status: 403 }),
      ),
    )

    await expect(cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: 10 })).rejects.toMatchObject({
      response: { status: 403 },
    })
  })

  it("rejects on 502 when the tax provider call fails", async () => {
    // CartService.java:285 `throw new TaxCalculationException(...)` -- CartExceptionHandler.java
    // maps TaxCalculationException to 502 (HttpStatus.BAD_GATEWAY), not 500.
    server.use(
      http.post("*/backend-api/cart/tax-estimate", () =>
        HttpResponse.json({ message: "Failed to calculate tax: Stripe unavailable" }, { status: 502 }),
      ),
    )

    await expect(cartAPI.getTaxEstimate({ addressId: "addr-1", shippingAmount: 10 })).rejects.toMatchObject({
      response: { status: 502 },
    })
  })
})

describe("cartAPI write error paths", () => {
  it("rejects with 400 when the product is entirely out of stock", async () => {
    // CartService.java:302 `validateUserProduct` only checks `userProduct.getStock() == 0` --
    // there is no per-request "requested quantity exceeds remaining stock" check anywhere in
    // createCartItem/updateCartItem, so a quantity that merely exceeds stock is accepted as-is.
    // The only stock rejection is zero stock, and UserProductOutOfStockException is mapped to 400
    // by CartExceptionHandler.java, not 409.
    server.use(
      http.put("*/backend-api/cart/items", () =>
        HttpResponse.json({ message: "The product is out of stock" }, { status: 400 }),
      ),
    )

    await expect(cartAPI.updateItemQuantity("up-1", 99)).rejects.toMatchObject({
      response: { status: 400, data: { message: "The product is out of stock" } },
    })
  })

  it("rejects with 400 when the product has been deactivated", async () => {
    // CartService.createCartItem has no dental-license check at all -- that validation only
    // happens later, at order creation time (OrderCreationService.java:670-684
    // `validateDentalLicenseRequirement`), never when adding an item to the cart. The only
    // reachable addItem error besides "not found" is UserProductNotActiveException (400),
    // thrown by validateUserProduct (CartService.java:305).
    server.use(
      http.post("*/backend-api/cart/items", () =>
        HttpResponse.json({ message: "The product is not active" }, { status: 400 }),
      ),
    )

    const error = await cartAPI.addItem("up-1", 1).catch((caught: unknown) => caught)

    expect((error as { response?: { status?: number } }).response?.status).toBe(400)
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
