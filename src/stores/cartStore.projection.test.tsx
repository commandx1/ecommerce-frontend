import type { QueryClient } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { cartCommands, refreshCart } from "@/features/cart/api/cart-queries"
import type { Cart } from "@/lib/api/cart"
import { queryKeys } from "@/lib/query/keys"
import QuerySessionBoundary from "@/lib/query/QuerySessionBoundary"
import { __setBrowserQueryClient, getQueryClient } from "@/lib/query/query-client"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { createQueryWrapper, createTestQueryClient } from "@/test/render"
import { useCartStore } from "./cartStore"

/**
 * Phase 2 step 2: `cartStore` state is a one-way projection of the `cart.detail` query entry (+
 * the cart MutationCache for `isLoading`/`error`). These tests pin the projection mechanics
 * themselves; the behavioural contract of every action stays covered by `cartStore.test.ts`.
 */

const store = () => useCartStore.getState()

interface Gate {
  release: () => void
}

function makeGate(): Gate & { wait: Promise<void> } {
  let release: () => void = () => undefined
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  return { release, wait }
}

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

beforeEach(() => {
  getCount = 0
  cartResponse = cartA
  client = createQueryWrapper().client
  useAuthStore.getState().setAuth(makeAccountUser({ id: "user-a" }), "token-a", "refresh-a")

  server.use(
    http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })),
    http.get("*/backend-api/cart", () => {
      getCount += 1
      return HttpResponse.json(cartResponse)
    }),
    http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),
    http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),
    http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),
  )
})

describe("cartStore projection - data", () => {
  it("projects items, cartId and cartCount from the cache entry after fetchCart", async () => {
    await store().fetchCart()

    const cached = client.getQueryData<Cart>(queryKeys.cart.detail())
    expect(store().items).toBe(cached?.cartItems)
    expect(store().cartId).toBe("cart-a")
    expect(store().cartCount).toBe(5)
  })

  it("follows cache updates that did not go through the store (refreshCart / cartCommands directly)", async () => {
    await refreshCart()
    expect(store().cartCount).toBe(5)

    cartResponse = makeCart({ cartId: "cart-a", cartItems: [makeCartItem({ quantity: 7 })] })
    await cartCommands.updateQuantity("up-1", 7)

    expect(store().items).toHaveLength(1)
    expect(store().cartCount).toBe(7)
  })

  it("is readable synchronously right after an awaited write resolves", async () => {
    await store().fetchCart()
    cartResponse = makeCart({
      cartId: "cart-a",
      cartItems: [...cartA.cartItems, makeCartItem({ id: "ci-a3", quantity: 1 })],
    })

    await store().addToCart("up-3", 1)

    // No waitFor: the projection must already be up to date when the action's promise resolves.
    expect(store().items).toHaveLength(3)
    expect(store().cartCount).toBe(6)
    expect(store().isLoading).toBe(false)
  })

  it("keeps the cart query from being garbage-collected (nothing observes it in step 2)", async () => {
    await store().fetchCart()

    const query = client.getQueryCache().find({ queryKey: queryKeys.cart.detail(), exact: true })
    expect(query?.gcTime).toBe(Number.POSITIVE_INFINITY)
  })

  it("hands out a fresh items array on every refetch, like the old store (no structural sharing)", async () => {
    await store().fetchCart()
    const first = store().items

    await store().fetchCart({ force: true })

    expect(store().items).not.toBe(first)
    expect(store().items).toEqual(first)
  })
})

describe("cartStore projection - isLoading", () => {
  it("is true while the cart GET is in flight and false once it settles", async () => {
    const gate = makeGate()
    server.use(
      http.get("*/backend-api/cart", async () => {
        await gate.wait
        return HttpResponse.json(cartResponse)
      }),
    )

    const pending = store().fetchCart()
    expect(store().isLoading).toBe(true)

    gate.release()
    await pending
    expect(store().isLoading).toBe(false)
  })

  it("stays true across the whole write: request in flight, then the forced refresh", async () => {
    const putGate = makeGate()
    const getGate = makeGate()
    let putArrived: () => void = () => undefined
    const putSeen = new Promise<void>((resolve) => {
      putArrived = resolve
    })
    let getArrived: () => void = () => undefined
    const getSeen = new Promise<void>((resolve) => {
      getArrived = resolve
    })
    server.use(
      http.put("*/backend-api/cart/items", async () => {
        putArrived()
        await putGate.wait
        return new HttpResponse(null, { status: 200 })
      }),
      http.get("*/backend-api/cart", async () => {
        getArrived()
        await getGate.wait
        return HttpResponse.json(cartResponse)
      }),
    )

    const pending = store().updateQuantity("up-1", 4)
    expect(store().isLoading).toBe(true)

    await putSeen
    expect(store().isLoading).toBe(true)
    putGate.release()

    await getSeen
    expect(store().isLoading).toBe(true)
    getGate.release()

    await pending
    expect(store().isLoading).toBe(false)
  })

  it("never shows the refreshed items while still loading (items land together with isLoading=false)", async () => {
    await store().fetchCart()
    const snapshots: { count: number; isLoading: boolean }[] = []
    const unsubscribe = useCartStore.subscribe((state) => {
      snapshots.push({ count: state.items.length, isLoading: state.isLoading })
    })

    // Removing the last lines: the old store set `items: []` and `isLoading: false` in one update,
    // so the cart page went straight from "ready" to "empty" without a loading flash.
    cartResponse = makeCart({ cartId: "cart-a", cartItems: [] })
    await store().removeFromCart("up-1")
    unsubscribe()

    expect(snapshots.some((snapshot) => snapshot.count === 0 && snapshot.isLoading)).toBe(false)
    expect(snapshots.at(-1)).toEqual({ count: 0, isLoading: false })
  })

  it("is true during clearCart and the emptied cart lands together with isLoading=false", async () => {
    await store().fetchCart()
    const gate = makeGate()
    server.use(
      http.delete("*/backend-api/cart", async () => {
        await gate.wait
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const snapshots: { count: number; isLoading: boolean }[] = []
    const unsubscribe = useCartStore.subscribe((state) => {
      snapshots.push({ count: state.items.length, isLoading: state.isLoading })
    })

    const pending = store().clearCart()
    expect(store().isLoading).toBe(true)
    gate.release()
    await pending
    unsubscribe()

    expect(snapshots.some((snapshot) => snapshot.count === 0 && snapshot.isLoading)).toBe(false)
    expect(store()).toMatchObject({ items: [], cartId: null, cartCount: 0, isLoading: false })
  })
})

describe("cartStore projection - resetCart", () => {
  it("marks the cart stale so the next plain fetch goes to the network (old lastFetchedAt = 0)", async () => {
    await store().fetchCart()
    expect(getCount).toBe(1)

    store().resetCart()
    expect(store()).toMatchObject({ items: [], cartId: null, cartCount: 0, lastFetchedAt: 0 })

    await store().fetchCart()
    expect(getCount).toBe(2)
    expect(store().cartCount).toBe(5)
  })
})

describe("cartStore projection - logout race", () => {
  function mountBoundary(): void {
    render(<QuerySessionBoundary queryClient={client}>probe</QuerySessionBoundary>)
  }

  it("a cart GET started before logout and resolving after it never repopulates the store", async () => {
    mountBoundary()
    await store().fetchCart()
    expect(store().cartCount).toBe(5)

    const gate = makeGate()
    let arrived: () => void = () => undefined
    const seen = new Promise<void>((resolve) => {
      arrived = resolve
    })
    server.use(
      http.get("*/backend-api/cart", async () => {
        arrived()
        await gate.wait
        return HttpResponse.json(cartA)
      }),
    )
    const lateFetch = store().fetchCart({ force: true })
    await seen

    // clearAuth (-> QuerySessionBoundary: cancelQueries + clear) then resetCart.
    await useAuthStore.getState().logout()
    expect(store()).toMatchObject({ items: [], cartCount: 0, cartId: null, isLoading: false, error: null })

    gate.release()
    await lateFetch
    // Give any stray continuation a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(store()).toMatchObject({ items: [], cartCount: 0, cartId: null, isLoading: false, error: null })
    expect(client.getQueryData(queryKeys.cart.detail())).toBeUndefined()
  })

  it("a cart write failing after logout does not set error or isLoading on the next session's store", async () => {
    mountBoundary()
    await store().fetchCart()

    const gate = makeGate()
    let arrived: () => void = () => undefined
    const seen = new Promise<void>((resolve) => {
      arrived = resolve
    })
    server.use(
      http.delete("*/backend-api/cart/items", async () => {
        arrived()
        await gate.wait
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const lateWrite = store().removeFromCart("up-1")
    await seen
    expect(store().isLoading).toBe(true)

    await useAuthStore.getState().logout()
    expect(store().isLoading).toBe(false)

    gate.release()
    await lateWrite

    expect(store()).toMatchObject({ items: [], cartCount: 0, isLoading: false, error: null })
  })

  it("an account switch (A -> B) drops A's cart from the store before B's cart loads", async () => {
    mountBoundary()
    await store().fetchCart()
    expect(store().cartId).toBe("cart-a")

    useAuthStore.getState().setAuth(makeAccountUser({ id: "user-b" }), "token-b", "refresh-b")
    expect(store()).toMatchObject({ items: [], cartCount: 0, cartId: null })

    cartResponse = makeCart({ cartId: "cart-b", cartItems: [makeCartItem({ quantity: 1 })] })
    await store().fetchCart()
    expect(store()).toMatchObject({ cartId: "cart-b", cartCount: 1 })
  })
})

describe("cartStore projection - QueryClient swap", () => {
  it("follows a replaced browser client and ignores the previous one", async () => {
    await store().fetchCart()
    expect(store().cartId).toBe("cart-a")
    const previous = client

    const next = createTestQueryClient()
    __setBrowserQueryClient(next)

    // The old client can no longer write into the store...
    previous.setQueryData(queryKeys.cart.detail(), makeCart({ cartId: "stale", cartItems: [] }))
    expect(store().cartId).toBe("cart-a")

    // ...while the new one is projected.
    next.setQueryData(
      queryKeys.cart.detail(),
      makeCart({ cartId: "cart-next", cartItems: [makeCartItem({ quantity: 4 })] }),
    )
    expect(store()).toMatchObject({ cartId: "cart-next", cartCount: 4 })
  })

  it("resubscribes to the lazily created client after the singleton was reset", async () => {
    __setBrowserQueryClient(undefined)

    await store().fetchCart()

    const created = getQueryClient()
    expect(created).not.toBe(client)
    expect(created.getQueryData(queryKeys.cart.detail())).toBeDefined()
    expect(store().cartCount).toBe(5)

    created.setQueryData(queryKeys.cart.detail(), makeCart({ cartId: "cart-a", cartItems: [] }))
    expect(store().cartCount).toBe(0)
  })

  it("adopts data already cached in a newly installed client", () => {
    const seeded = createTestQueryClient()
    seeded.setQueryData(
      queryKeys.cart.detail(),
      makeCart({ cartId: "cart-seeded", cartItems: [makeCartItem({ quantity: 2 })] }),
    )

    __setBrowserQueryClient(seeded)

    expect(store()).toMatchObject({ cartId: "cart-seeded", cartCount: 2 })
  })
})
