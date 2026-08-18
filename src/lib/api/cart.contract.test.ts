import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { useCartStore } from "@/stores/cartStore"
import { cartAPI } from "./cart"

const cartWithSchedule = {
  cartId: "2ba28f52-f51d-4e67-8452-53a7f8061804",
  cartItems: [
    {
      id: "ci-1",
      quantity: 2,
      autoOrder: "TWO_WEEKS",
      userProduct: {
        userProductId: "up-1",
        oldPrice: 70,
        price: 56,
        discount: 20,
        shipmentFee: 5,
        heavyShippingSurcharge: 0,
        stock: 40,
        stockAlert: null,
        userProductAlert: null,
        sellerId: "seller-1",
        sellerName: "Acme Dental",
      },
      product: {
        id: "p-1",
        name: "Intra Oral Mixing Tips",
        coverPhotoPath: "/uploads/tips.png",
        productAlert: null,
        dentalLicenseRequired: null,
      },
    },
  ],
}

let capturedPutBody: Record<string, unknown> | null = null
let capturedPostBody: Record<string, unknown> | null = null

const server = setupServer(
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

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  capturedPutBody = null
  capturedPostBody = null
  useCartStore.getState().resetCart()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
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
