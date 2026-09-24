import type { QueryClient } from "@tanstack/react-query"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { useCartCount, useCartItems } from "@/features/cart/hooks/useCartQueries"
import type { Cart } from "@/lib/api/cart"
import { mutationKeys } from "@/lib/query/keys"
import QuerySessionBoundary from "@/lib/query/QuerySessionBoundary"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { cachedCart } from "@/test/cart"
import { makeAccountUser, makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { act, createTestQueryClient, render, screen, waitFor } from "@/test/render"
import { cartCommands, refreshCart } from "./cart-queries"

/**
 * The cart lives in the query cache, so session teardown is `QuerySessionBoundary`'s cache clear
 * (triggered by the auth user changing) - there is no cart-specific reset any more. These pin the
 * cart-visible consequences: nothing of account A survives into the next session, not even a
 * request that was still in flight when the session ended.
 */

let getCount: number
let cartResponse: Cart
let client: QueryClient

const cartA = makeCart({
  cartId: "cart-a",
  cartItems: [
    makeCartItem({ id: "ci-a1", quantity: 2, userProduct: makeCartUserProduct({ userProductId: "up-1" }) }),
    makeCartItem({ id: "ci-a2", quantity: 3, userProduct: makeCartUserProduct({ userProductId: "up-2" }) }),
  ],
})

/**
 * Mirrors the app's header badges, which also read the auth user. That matters: `clear()` drops
 * the Query instance a mounted observer is bound to, and the observer only rebinds to the new
 * cache entry on its next render - the identity change is what triggers that render.
 */
function CartBadge() {
  useAuthStore((state) => state.user?.id)
  return <span data-testid="badge">{useCartCount()}</span>
}

/** A reader with no other reason to re-render on logout, like the checkout order summary. */
function CartLines() {
  return <span data-testid="lines">{useCartItems().length}</span>
}

const badge = () => screen.getByTestId("badge").textContent
const lines = () => screen.getByTestId("lines").textContent

/** Parks the next matching request until released; `seen` resolves once it has arrived. */
function gate(method: "get" | "delete", path: string, respond: () => Response) {
  let release: () => void = () => undefined
  let arrived: () => void = () => undefined
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  const seen = new Promise<void>((resolve) => {
    arrived = resolve
  })
  server.use(
    http[method](path, async () => {
      arrived()
      await released
      return respond()
    }),
  )
  return { release, seen }
}

beforeEach(async () => {
  getCount = 0
  cartResponse = cartA
  client = createTestQueryClient()
  useAuthStore.getState().setAuth(makeAccountUser({ id: "user-a" }), "token-a", "refresh-a")
  server.use(
    http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })),
    http.get("*/backend-api/cart", () => {
      getCount += 1
      return HttpResponse.json(cartResponse)
    }),
  )

  render(
    <QuerySessionBoundary queryClient={client}>
      <CartBadge />
      <CartLines />
    </QuerySessionBoundary>,
    { queryClient: client },
  )
  await act(() => refreshCart())
  await waitFor(() => expect(badge()).toBe("5"))
  expect(lines()).toBe("2")
})

describe("cart across a session boundary", () => {
  it("logout drops the cached cart, and the next refresh goes to the network", async () => {
    await act(() => useAuthStore.getState().logout())

    await waitFor(() => expect(badge()).toBe("0"))
    // Also emptied for a reader that is not re-rendered by the identity change itself.
    expect(lines()).toBe("0")
    expect(cachedCart(client)).toBeUndefined()

    await act(() => refreshCart())
    expect(getCount).toBe(2)
  })

  it("an account switch (A -> B) drops A's cart before B's cart loads", async () => {
    act(() => {
      useAuthStore.getState().setAuth(makeAccountUser({ id: "user-b" }), "token-b", "refresh-b")
    })
    await waitFor(() => expect(badge()).toBe("0"))

    cartResponse = makeCart({ cartId: "cart-b", cartItems: [makeCartItem({ quantity: 1 })] })
    await act(() => refreshCart())

    await waitFor(() => expect(badge()).toBe("1"))
    expect(cachedCart(client)?.cartId).toBe("cart-b")
  })

  it("a cart GET started before logout and resolving after it never repopulates the cache", async () => {
    const get = gate("get", "*/backend-api/cart", () => HttpResponse.json(cartA))
    const lateFetch = refreshCart({ force: true })
    await get.seen

    await act(() => useAuthStore.getState().logout())
    get.release()
    await act(() => lateFetch)

    expect(cachedCart(client)).toBeUndefined()
    await waitFor(() => expect(badge()).toBe("0"))
  })

  it("a cart write failing after logout leaves no write in flight and no cart behind", async () => {
    const del = gate("delete", "*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 }))
    const lateWrite = cartCommands.removeItem("up-1")
    await del.seen
    expect(client.isMutating({ mutationKey: mutationKeys.cart.all })).toBe(1)

    await act(() => useAuthStore.getState().logout())
    expect(client.isMutating({ mutationKey: mutationKeys.cart.all })).toBe(0)

    del.release()
    await act(() => lateWrite)

    await waitFor(() => expect(client.isMutating({ mutationKey: mutationKeys.cart.all })).toBe(0))
    expect(client.getMutationCache().getAll()).toHaveLength(0)
    expect(cachedCart(client)).toBeUndefined()
    await waitFor(() => expect(badge()).toBe("0"))
  })
})
