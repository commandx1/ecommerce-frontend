import { renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { cartCommands, refreshCart } from "@/features/cart/api/cart-queries"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useCartCount, useCartId, useCartItems } from "./useCartQueries"

/**
 * These are disabled observers (design doc §5): they must be pure subscriptions onto the
 * `cart.detail` cache entry and never fetch on their own - only the fetch owners (`refreshCart`,
 * `cartCommands`) may cause a `GET /cart`.
 */

let getCartCount: number
let cartResponse: ReturnType<typeof makeCart>

const initialCart = makeCart({
  cartId: "cart-1",
  cartItems: [
    makeCartItem({ id: "ci-1", quantity: 2, userProduct: makeCartUserProduct({ userProductId: "up-1" }) }),
    makeCartItem({ id: "ci-2", quantity: 3, userProduct: makeCartUserProduct({ userProductId: "up-2" }) }),
  ],
})

beforeEach(() => {
  getCartCount = 0
  cartResponse = initialCart
  useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")
  server.use(
    http.get("*/backend-api/cart", () => {
      getCartCount += 1
      return HttpResponse.json(cartResponse)
    }),
    http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),
  )
})

describe("useCartItems / useCartCount / useCartId", () => {
  it("do not fetch on mount - GET /cart count stays 0", () => {
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => ({ items: useCartItems(), count: useCartCount(), id: useCartId() }), {
      wrapper,
    })

    expect(result.current.items).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.id).toBeNull()
    expect(getCartCount).toBe(0)
  })

  it("read whatever an owner already put in the cache, still without fetching themselves", async () => {
    const { wrapper } = createQueryWrapper()
    await refreshCart()
    expect(getCartCount).toBe(1)

    const { result } = renderHook(() => ({ items: useCartItems(), count: useCartCount(), id: useCartId() }), {
      wrapper,
    })

    expect(result.current.count).toBe(5)
    expect(result.current.items).toHaveLength(2)
    expect(result.current.id).toBe("cart-1")
    expect(getCartCount).toBe(1)
  })

  it("follow a write that goes through cartCommands without an extra GET beyond the write's own refresh", async () => {
    const { wrapper, client } = createQueryWrapper()
    await refreshCart()
    expect(getCartCount).toBe(1)

    const { result } = renderHook(() => useCartCount(), { wrapper })
    expect(result.current).toBe(5)

    cartResponse = makeCart({
      cartId: "cart-1",
      cartItems: [
        ...initialCart.cartItems,
        makeCartItem({ id: "ci-3", quantity: 1, userProduct: makeCartUserProduct({ userProductId: "up-3" }) }),
      ],
    })
    await cartCommands.addItem("up-3", 1)

    await waitFor(() => expect(result.current).toBe(6))
    // addItem's own forced refresh is the only extra GET.
    expect(getCartCount).toBe(2)
    expect(client.getQueryData(queryKeys.cart.detail())).toBeDefined()
  })
})
