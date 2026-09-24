import type { QueryClient } from "@tanstack/react-query"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type Cart, cartAPI } from "@/lib/api/cart"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { type CartData, cartCommands, cartQueryOptions, EMPTY_CART, refreshCart } from "./cart-queries"

/**
 * Port of `src/stores/cartStore.test.ts` / `cartStore.scale.test.ts` onto the query-cache core.
 * These suites still assert HTTP call counts, not just cache state: the 1s dedup window and
 * in-flight collapsing are invisible in the cached data (every path ends with the same items),
 * so a regression that silently fires a second request would pass a data-only assertion.
 */
interface RequestCounts {
  getCart: number
  addItem: number
  updateItem: number
  removeItem: number
  clearCart: number
}

let counts: RequestCounts
let lastPostBody: Record<string, unknown> | null
let lastPutBody: Record<string, unknown> | null
let cartResponse: Cart
let client: QueryClient

function jsonCart(): Response {
  return HttpResponse.json(cartResponse)
}

function cached(): CartData | undefined {
  return client.getQueryData<CartData>(queryKeys.cart.detail())
}

beforeEach(() => {
  counts = { getCart: 0, addItem: 0, updateItem: 0, removeItem: 0, clearCart: 0 }
  lastPostBody = null
  lastPutBody = null
  cartResponse = makeCart()
  client = createQueryWrapper().client

  // Every suite in this file exercises write/refresh logic against an already-signed-in shopper.
  // The guest guard on `addItem` is covered on its own below.
  useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")

  server.use(
    // Signing in above means a real 401 now drives the axios interceptor's `handleAuthFailure`
    // into an actual `authAPIDirect.logout()` call (it only skips that when there is no token
    // pair). `authStore.logout` swallows the failure either way, but this keeps MSW quiet.
    http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })),
    http.get("*/backend-api/cart", () => {
      counts.getCart += 1
      return jsonCart()
    }),
    http.post("*/backend-api/cart/items", async ({ request }) => {
      counts.addItem += 1
      lastPostBody = (await request.json()) as Record<string, unknown>
      return new HttpResponse(null, { status: 200 })
    }),
    http.put("*/backend-api/cart/items", async ({ request }) => {
      counts.updateItem += 1
      lastPutBody = (await request.json()) as Record<string, unknown>
      return new HttpResponse(null, { status: 200 })
    }),
    http.delete("*/backend-api/cart/items", () => {
      counts.removeItem += 1
      return new HttpResponse(null, { status: 200 })
    }),
    http.delete("*/backend-api/cart", () => {
      counts.clearCart += 1
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Holds the GET open so overlapping callers are guaranteed to be concurrent. */
function gateGetCart(): { release: () => void } {
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  server.use(
    http.get("*/backend-api/cart", async () => {
      counts.getCart += 1
      await gate
      return jsonCart()
    }),
  )

  return { release }
}

// ---------------------------------------------------------------------------
// old: "cartStore fetchCart de-duplication window" -> refreshCart 1s staleTime window
// ---------------------------------------------------------------------------
describe("refreshCart de-duplication window", () => {
  /**
   * Only `Date` is faked. `setTimeout`/`queueMicrotask` stay real because MSW's request
   * interception and axios both depend on them; faking every timer deadlocks the requests.
   */
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-08-22T10:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const baseTime = new Date("2026-08-22T10:00:00.000Z").getTime()

  it("skips the request when a second refresh lands 500ms after the first", async () => {
    await refreshCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date(baseTime + 500))
    await refreshCart()

    expect(counts.getCart).toBe(1)
  })

  it("issues the request again once the window has elapsed (1001ms)", async () => {
    await refreshCart()

    vi.setSystemTime(new Date(baseTime + 1001))
    await refreshCart()

    expect(counts.getCart).toBe(2)
  })

  it("fires at exactly 1000ms because the cache treats the boundary as stale", async () => {
    await refreshCart()

    // Boundary lock: matches the old store's strict `now - lastFetchedAt < 1000` guard, which
    // let the request go out at exactly 1000ms. Native `staleTime` freshness math agrees: at
    // 1000ms remaining-until-stale hits exactly 0, which counts as stale.
    vi.setSystemTime(new Date(baseTime + 1000))
    await refreshCart()

    expect(counts.getCart).toBe(2)
  })

  it("does not fire at 999ms", async () => {
    await refreshCart()

    vi.setSystemTime(new Date(baseTime + 999))
    await refreshCart()

    expect(counts.getCart).toBe(1)
  })

  it("always requests when force is set, even inside the window", async () => {
    await refreshCart()

    vi.setSystemTime(new Date(baseTime + 10))
    await refreshCart({ force: true })
    await refreshCart({ force: true })

    expect(counts.getCart).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore fetchCart error matrix > does not retry within the dedup window after a 500 -
// force is required" -> refreshCart also arms the dedup window on a FAILED fetch, mirroring
// `cartStore.ts:110-112` stamping `lastFetchedAt` on failure too ("a downed backend doesn't get
// hammered"). A query that only ever errored has no successful `dataUpdatedAt` for TanStack's own
// staleTime check to key off, so `refreshCart` tracks `errorUpdatedAt` itself for this case.
// ---------------------------------------------------------------------------
describe("refreshCart failure-side dedup window (mirrors cartStore.ts stamping lastFetchedAt on failure)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-08-22T10:00:00.000Z"))
    server.use(
      http.get("*/backend-api/cart", () => {
        counts.getCart += 1
        return new HttpResponse(null, { status: 500 })
      }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const baseTime = new Date("2026-08-22T10:00:00.000Z").getTime()

  it("does not retry within the dedup window after a 500 - force is required", async () => {
    await refreshCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date(baseTime + 500))
    await refreshCart()
    expect(counts.getCart).toBe(1)

    await refreshCart({ force: true })
    expect(counts.getCart).toBe(2)
  })

  it("reissues once the window has elapsed (1001ms) without needing force", async () => {
    await refreshCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date(baseTime + 1001))
    await refreshCart()

    expect(counts.getCart).toBe(2)
  })

  it("fires at exactly 1000ms - the same strict less-than boundary as the success-side window", async () => {
    await refreshCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date(baseTime + 1000))
    await refreshCart()

    expect(counts.getCart).toBe(2)
  })

  it("a forced refresh right after a 500 fires immediately, bypassing the window", async () => {
    await refreshCart()
    expect(counts.getCart).toBe(1)

    await refreshCart({ force: true })

    expect(counts.getCart).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore fetchCart in-flight de-duplication" -> native QueryClient in-flight collapsing
// ---------------------------------------------------------------------------
describe("refreshCart in-flight de-duplication", () => {
  it("collapses two same-tick refreshes into a single request", async () => {
    const { release } = gateGetCart()

    const first = refreshCart()
    const second = refreshCart()
    release()
    await Promise.all([first, second])

    expect(counts.getCart).toBe(1)
  })

  it("lets a third caller ride the same in-flight fetch under a slow response", async () => {
    const { release } = gateGetCart()

    const first = refreshCart()
    const second = refreshCart()
    const third = refreshCart()
    release()
    await Promise.all([first, second, third])

    expect(counts.getCart).toBe(1)
    expect(cached()?.cartItems).toHaveLength(1)
  })

  it("de-duplicates concurrent force refreshes against an in-flight plain refresh - one request goes out", async () => {
    const { release } = gateGetCart()

    // `force: true` only skips the staleTime freshness check, not the underlying in-flight
    // fetch: if a request is already flying, a forced call joins it instead of racing a second
    // GET whose response could land first and stomp the newer one's state.
    const first = refreshCart({ force: true })
    const second = refreshCart({ force: true })
    release()
    await Promise.all([first, second])

    expect(counts.getCart).toBe(1)
  })

  it("a failed refresh does not block a later forced refresh from firing", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))
    await refreshCart()
    expect(client.getQueryState(queryKeys.cart.detail())?.error).toBeTruthy()

    server.use(
      http.get("*/backend-api/cart", () => {
        counts.getCart += 1
        return jsonCart()
      }),
    )
    await refreshCart({ force: true })

    expect(counts.getCart).toBe(1)
    expect(client.getQueryState(queryKeys.cart.detail())?.error).toBeFalsy()
  })

  /**
   * NOT PORTED: old "does not leave a stale in-flight guard after a failed request" and "clears
   * the in-flight guard on resetCart so the next fetch is not swallowed" asserted on
   * `cartStore`'s module-level `inFlightCartFetch` flag, which no longer exists - the in-flight
   * promise now lives entirely inside `QueryClient`'s own `Query` instance and is not a piece of
   * state this file can leak or reset independently. The closest surviving behaviour (a failed
   * refresh does not wedge later refreshes) is covered by the test above.
   */
})

// ---------------------------------------------------------------------------
// old: "cartStore fetchCart error matrix" -> cartQueryOptions()/refreshCart() error handling
// ---------------------------------------------------------------------------
describe("cartQueryOptions error matrix", () => {
  it("treats 404 as an empty cart without an error", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 404 })))

    await refreshCart()

    expect(cached()).toEqual(EMPTY_CART)
    expect(client.getQueryState(queryKeys.cart.detail())?.error).toBeNull()
    expect(client.getQueryState(queryKeys.cart.detail())?.dataUpdatedAt).toBeGreaterThan(0)
  })

  it("treats 400 as an empty cart without an error", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 400 })))

    await refreshCart()

    expect(cached()).toEqual(EMPTY_CART)
    expect(client.getQueryState(queryKeys.cart.detail())?.error).toBeNull()
  })

  it("surfaces a 500 as a query error without refreshCart itself throwing", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))

    await expect(refreshCart()).resolves.toBeUndefined()

    const state = client.getQueryState(queryKeys.cart.detail())
    expect(state?.error).toBeInstanceOf(Error)
    expect((state?.error as Error).message).toBe("Request failed with status code 500")
    expect(state?.fetchStatus).toBe("idle")
  })

  // The failure-side dedup window itself (a second plain refreshCart after a 500 is suppressed
  // for 1s, force required to bypass) is covered by "refreshCart failure-side dedup window"
  // above, next to the success-side window tests it mirrors.

  it("swallows an auth-handled 401 without an error", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 401 })))

    await refreshCart()

    const state = client.getQueryState(queryKeys.cart.detail())
    expect(state?.error).toBeTruthy() // the rejection is still recorded on the query...
    expect((state?.error as { authHandled?: boolean } | undefined)?.authHandled).toBe(true) // ...but flagged authHandled for the owning hook to ignore.
    expect(cached()).toBeUndefined()
  })

  /**
   * Mirrors `cartStore.ts:95-101`: unlike a 400/404/500, an auth-handled 401 must NOT arm the
   * failure-side dedup window - the old store's comment explains why (re-stamping the window
   * "would re-open the dedup window and leave the user staring at an empty cart for ~1s right
   * after login"). A plain refresh immediately after one must still go to the network.
   */
  it("does not arm the failure-side dedup window on an auth-handled 401", async () => {
    let getCartCount = 0
    server.use(
      http.get("*/backend-api/cart", () => {
        getCartCount += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )

    await refreshCart()
    expect(getCartCount).toBe(1)

    await refreshCart()
    expect(getCartCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore fetchCart success state" -> cartQueryOptions()/refreshCart() success state
// ---------------------------------------------------------------------------
describe("refreshCart success state", () => {
  it("caches items and cartId as returned by the API", async () => {
    cartResponse = makeCart({
      cartItems: [
        makeCartItem({ id: "ci-1", quantity: 3, userProduct: makeCartUserProduct({ userProductId: "up-1" }) }),
        makeCartItem({ id: "ci-2", quantity: 3, userProduct: makeCartUserProduct({ userProductId: "up-2" }) }),
      ],
    })

    await refreshCart()

    expect(cached()?.cartItems).toHaveLength(2)
    expect(cached()?.cartId).toBe(cartResponse.cartId)
  })

  it("scale: caches 10,000 lines and reports fetch time", async () => {
    const N = 10_000
    cartResponse = makeCart({
      cartItems: Array.from({ length: N }, (_, i) =>
        makeCartItem({
          id: `ci-${i}`,
          quantity: (i % 5) + 1,
          userProduct: makeCartUserProduct({ userProductId: `up-${i}` }),
        }),
      ),
    })
    const expectedCount = cartResponse.cartItems.reduce((sum, item) => sum + item.quantity, 0)

    const start = performance.now()
    await refreshCart({ force: true })
    const elapsedMs = performance.now() - start

    expect(cached()?.cartItems).toHaveLength(N)
    expect(cached()?.cartItems.reduce((sum, item) => sum + item.quantity, 0)).toBe(expectedCount)
    // Not asserted, only surfaced for the report:
    // biome-ignore lint/suspicious/noConsole: scale-test timing report, not app code.
    console.info(`[scale] refreshCart over ${N} items: ${elapsedMs.toFixed(2)}ms`)
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore resolveAutoOrder" -> cartCommands.updateQuantity/addItem reading the cache
// ---------------------------------------------------------------------------
describe("resolveAutoOrder (read from the query cache)", () => {
  it("resends the schedule already on the cached item when autoOrder is omitted", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })
    await refreshCart()

    await cartCommands.updateQuantity("up-1", 5)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 5, autoOrder: "TWO_WEEKS" })
  })

  it("falls back to null when the product is not in the cached cart", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })
    await refreshCart()

    await cartCommands.addItem("up-unknown", 2)

    expect(lastPostBody).toEqual({ userProductId: "up-unknown", quantity: 2, autoOrder: null })
  })

  it("clears the schedule when null is passed explicitly", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "ONE_MONTH" })] })
    await refreshCart()

    await cartCommands.updateQuantity("up-1", 4, null)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 4, autoOrder: null })
  })

  it("falls back to null when the cart has not been cached yet (write-before-first-load)", async () => {
    // Preserved quirk (design doc §10.4): a write before the first cart load resolves autoOrder
    // against an empty item list, same as the old store's initial `items: []`.
    await cartCommands.addItem("up-1", 1)

    expect(lastPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: null })
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore setItemAutoOrder" -> cartCommands.setItemAutoOrder
// ---------------------------------------------------------------------------
describe("cartCommands.setItemAutoOrder", () => {
  beforeEach(async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ quantity: 2, autoOrder: "TWO_WEEKS" })] })
    await refreshCart()
  })

  it("is a silent no-op for a product that is not in the cart", async () => {
    const before = cached()

    await cartCommands.setItemAutoOrder("up-not-there", "ONE_MONTH")

    expect(counts.updateItem).toBe(0)
    expect(counts.removeItem).toBe(0)
    expect(cached()).toBe(before)
  })

  it("reuses the item's current quantity when none is given", async () => {
    await cartCommands.setItemAutoOrder("up-1", "ONE_MONTH")

    // A schedule-only edit must not overwrite a quantity the user is still debouncing.
    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: "ONE_MONTH" })
  })

  it("flushes an explicit quantity in the same write", async () => {
    await cartCommands.setItemAutoOrder("up-1", "ONE_MONTH", 7)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 7, autoOrder: "ONE_MONTH" })
  })

  it("sends an explicit null to clear the schedule", async () => {
    await cartCommands.setItemAutoOrder("up-1", null)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: null })
  })

  it("delegates to removeItem when the resolved quantity is zero", async () => {
    await cartCommands.setItemAutoOrder("up-1", "ONE_MONTH", 0)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("delegates to removeItem for a negative quantity", async () => {
    await cartCommands.setItemAutoOrder("up-1", null, -3)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("rethrows a non-auth failure", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(cartCommands.setItemAutoOrder("up-1", "ONE_MONTH")).rejects.toThrow()
  })

  it("swallows an auth-handled failure without rethrowing", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(cartCommands.setItemAutoOrder("up-1", "ONE_MONTH")).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore addToCart error contract" -> cartCommands.addItem
// ---------------------------------------------------------------------------
describe("cartCommands.addItem error contract", () => {
  it("refreshes the cache after a successful add", async () => {
    await cartCommands.addItem("up-1", 2)

    expect(counts.addItem).toBe(1)
    expect(counts.getCart).toBe(1)
    expect(cached()?.cartItems).toHaveLength(1)
  })

  it("throws on an auth-handled 401", async () => {
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(cartCommands.addItem("up-1", 1)).rejects.toThrow()
  })

  /**
   * REGRESSION GUARD (ported from K11): a failed add must reach the caller so its own catch
   * block (toast) actually runs - swallowing it here would leave a finished spinner and no
   * warning while the item never entered the cart.
   */
  it("rethrows a 403 so the caller can warn", async () => {
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 403 })))

    await expect(cartCommands.addItem("up-1", 1)).rejects.toThrow("Request failed with status code 403")
  })

  it("rethrows a 500 so the caller can warn", async () => {
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(cartCommands.addItem("up-1", 1)).rejects.toThrow("Request failed with status code 500")
  })

  it("does not refresh the cache when the add itself failed", async () => {
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(cartCommands.addItem("up-1", 1)).rejects.toThrow()

    expect(counts.getCart).toBe(0)
  })

  it("defaults the quantity to 1", async () => {
    await cartCommands.addItem("up-1")

    expect(lastPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: null })
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore removeFromCart error contract" -> cartCommands.removeItem
// ---------------------------------------------------------------------------
describe("cartCommands.removeItem error contract", () => {
  it("refreshes the cache after a successful remove", async () => {
    await cartCommands.removeItem("up-1")

    expect(counts.removeItem).toBe(1)
    expect(counts.getCart).toBe(1)
  })

  it("resolves silently on an auth-handled 401 - no throw", async () => {
    server.use(http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(cartCommands.removeItem("up-1")).resolves.toBeUndefined()
  })

  it("resolves silently on a 500 too (swallowed, not surfaced on the cache)", async () => {
    server.use(http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(cartCommands.removeItem("up-1")).resolves.toBeUndefined()
    expect(counts.getCart).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore updateQuantity error contract" -> cartCommands.updateQuantity
// ---------------------------------------------------------------------------
describe("cartCommands.updateQuantity error contract", () => {
  it("delegates to removeItem (DELETE) at quantity 0", async () => {
    await cartCommands.updateQuantity("up-1", 0)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("delegates to removeItem (DELETE) for a negative quantity", async () => {
    await cartCommands.updateQuantity("up-1", -1)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("resolves silently on an auth-handled 401 - no throw", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(cartCommands.updateQuantity("up-1", 3)).resolves.toBeUndefined()
  })

  it("resolves silently on a 500 too, without throwing", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(cartCommands.updateQuantity("up-1", 3)).resolves.toBeUndefined()
    expect(counts.getCart).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore clearCart" -> cartCommands.clearCart
// ---------------------------------------------------------------------------
describe("cartCommands.clearCart", () => {
  it("is a no-op while there is no cached cartId", async () => {
    expect(cached()?.cartId).toBeUndefined()

    await cartCommands.clearCart()

    expect(counts.clearCart).toBe(0)
  })

  it("sets the cache to EMPTY_CART and invalidates without an extra GET after a successful clear", async () => {
    await refreshCart()
    expect(cached()?.cartId).not.toBeNull()

    await cartCommands.clearCart()

    expect(counts.clearCart).toBe(1)
    expect(cached()).toEqual(EMPTY_CART)
    // No refetch here, unlike the item mutations.
    expect(counts.getCart).toBe(1)

    // The query is invalidated (refetchType "none"), so the *next* plain refreshCart still goes
    // to the network instead of serving stale pre-clear data, mirroring the old
    // `lastFetchedAt = 0` reset.
    await refreshCart()
    expect(counts.getCart).toBe(2)
  })

  it("resolves silently on an auth-handled 401", async () => {
    await refreshCart()
    server.use(http.delete("*/backend-api/cart", () => new HttpResponse(null, { status: 401 })))

    await expect(cartCommands.clearCart()).resolves.toBeUndefined()
  })

  it("leaves the cached items untouched after a 500", async () => {
    await refreshCart()
    server.use(http.delete("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))

    await cartCommands.clearCart()

    expect(cached()?.cartItems).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore defaults" / "cartStore resetCart"
// NOT PORTED: both assert on `useCartStore`'s own Zustand defaults/reset, which are store
// internals this file has no equivalent of - the query cache simply has no entry until the
// first `refreshCart()`/write (`cached()` is `undefined`, asserted inline above), and clearing
// the whole cache on identity change is `QuerySessionBoundary`'s job (Step 0), not this file's.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// old: "cartStore transient isLoading/error at the start of a write"
// NOT PORTED: asserted on the store's synchronous `set({ isLoading: true, error: null })` before
// the first `await`. `cartCommands` carry no such local state in Step 1 - `isLoading` becomes
// `isFetching || useIsMutating(...)` off the query/mutation cache once a hook wraps these
// commands (§5/§7 Step 4), which is outside this file's scope.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// old: "cartStore post-write refetch bypasses the de-dup window" -> commands force refreshCart
// ---------------------------------------------------------------------------
describe("cartCommands post-write refresh bypasses the staleTime window", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-08-22T10:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("addItem", async () => {
    await refreshCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date("2026-08-22T10:00:00.100Z"))
    await cartCommands.addItem("up-1", 1)

    expect(counts.getCart).toBe(2)
  })

  it("updateQuantity", async () => {
    await refreshCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date("2026-08-22T10:00:00.100Z"))
    await cartCommands.updateQuantity("up-1", 3)

    expect(counts.getCart).toBe(2)
  })

  it("setItemAutoOrder", async () => {
    cartResponse = makeCart({
      cartItems: [makeCartItem({ quantity: 2, userProduct: makeCartUserProduct({ userProductId: "up-1" }) })],
    })
    await refreshCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date("2026-08-22T10:00:00.100Z"))
    await cartCommands.setItemAutoOrder("up-1", "ONE_MONTH")

    expect(counts.getCart).toBe(2)
  })
})

describe("refreshCart force joins the shared in-flight fetch", () => {
  it("a concurrent plain refresh is deduped against a forced refresh's in-flight request", async () => {
    const { release } = gateGetCart()

    // `force: true` only bypasses the staleTime freshness check; it must still join an
    // already-flying request rather than racing a second GET whose response could land first
    // and overwrite the newer state (the "last response wins" race this fix closes).
    const forced = refreshCart({ force: true })
    const plain = refreshCart()
    release()
    await Promise.all([forced, plain])

    expect(counts.getCart).toBe(1)
  })
})

/**
 * old: "cartStore addToCart auth checks are each independently load-bearing"
 * `isAuthErrorStatus` only ever returns true for a 401, and the axios interceptor in
 * `lib/api/client.ts` sets `error.authHandled = true` on every 401 before the rejection reaches
 * this command - so in real traffic both conditions always agree. In `cartCommands.addItem` this
 * no longer branches on them at all (every failure rethrows unconditionally, see the file's
 * comment), so the two independent-guard cases collapse into the single "always rethrows" test
 * above (`throws on an auth-handled 401`, `rethrows a 403`, `rethrows a 500`). Kept here as a
 * cross-check via `cartAPI` spies, matching the old test's technique of bypassing the interceptor.
 */
describe("cartCommands.addItem always rethrows, independent of the interceptor", () => {
  it("throws when the interceptor already marked the error auth-handled, even at a non-401 status", async () => {
    const fakeError = Object.assign(new Error("weird"), { authHandled: true, response: { status: 500 } })
    vi.spyOn(cartAPI, "addItem").mockRejectedValueOnce(fakeError)

    await expect(cartCommands.addItem("up-1", 1)).rejects.toBe(fakeError)
  })

  it("throws on a 401 even when the interceptor has not marked it auth-handled", async () => {
    const fakeError = Object.assign(new Error("weird"), { response: { status: 401 } })
    vi.spyOn(cartAPI, "addItem").mockRejectedValueOnce(fakeError)

    await expect(cartCommands.addItem("up-1", 1)).rejects.toBe(fakeError)
  })
})

/**
 * old: "cartStore auth-handled branches reset isLoading on their own, independent of the logout
 * cascade" - NOT PORTED: asserted `store().isLoading === false`, which has no equivalent here
 * (no local loading state in Step 1). The auth-handled swallow/rethrow behaviour itself is still
 * covered above (`removeItem`/`updateQuantity` resolve silently, `setItemAutoOrder` swallows,
 * `clearCart` resolves silently) via `cartAPI` spies where relevant.
 */

/**
 * old: "cartStore generic error message fallback for a non-Error rejection" - the query cache
 * stores whatever `queryFn`/the command rejects with verbatim (there is no
 * `error instanceof Error ? error.message : "<generic>"` fallback message to construct anymore,
 * since Step 1 carries no local `error: string | null` field for a hook to read). Ported as: the
 * cache/command still handle a non-Error rejection without crashing, and (for `addItem`, which
 * rethrows) hand the original value back to the caller unchanged.
 */
describe("non-Error rejections are handled without a message fallback", () => {
  it("refreshCart: a query error surfaces on the query state and refreshCart still does not throw", async () => {
    vi.spyOn(cartAPI, "getCart").mockRejectedValueOnce("network exploded")

    await expect(refreshCart()).resolves.toBeUndefined()

    expect(client.getQueryState(queryKeys.cart.detail())?.error).toBe("network exploded")
  })

  it("addItem: rethrows the original non-Error value unchanged", async () => {
    vi.spyOn(cartAPI, "addItem").mockRejectedValueOnce("network exploded")

    await expect(cartCommands.addItem("up-1", 1)).rejects.toBe("network exploded")
  })

  it("removeItem: swallows a non-Error rejection just like an Error one", async () => {
    vi.spyOn(cartAPI, "removeItem").mockRejectedValueOnce("network exploded")

    await expect(cartCommands.removeItem("up-1")).resolves.toBeUndefined()
  })

  it("updateQuantity: swallows a non-Error rejection just like an Error one", async () => {
    vi.spyOn(cartAPI, "updateItemQuantity").mockRejectedValueOnce("network exploded")

    await expect(cartCommands.updateQuantity("up-1", 3)).resolves.toBeUndefined()
  })

  it("clearCart: swallows a non-Error rejection just like an Error one", async () => {
    await refreshCart()
    vi.spyOn(cartAPI, "clearCart").mockRejectedValueOnce("network exploded")

    await expect(cartCommands.clearCart()).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// old: "cartStore addToCart guest guard" -> cartCommands.addItem guest guard
// ---------------------------------------------------------------------------
describe("cartCommands.addItem guest guard", () => {
  const assignMock = window.location.assign as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    assignMock.mockClear()
    Object.assign(window.location, {
      pathname: "/products/p-1",
      search: "?vendorId=up-1",
      href: "http://localhost:3000/products/p-1?vendorId=up-1",
    })
  })

  it("redirects to /login with reason=login-required instead of calling the API", async () => {
    await expect(cartCommands.addItem("up-1", 1)).rejects.toMatchObject({ authHandled: true })

    expect(counts.addItem).toBe(0)
    expect(assignMock).toHaveBeenCalledTimes(1)
    const target = String(assignMock.mock.calls[0][0])
    expect(target).toContain("reason=login-required")
    expect(target).toContain(`redirect=${encodeURIComponent("/products/p-1?vendorId=up-1")}`)
  })

  it("omits the redirect param on the home page", async () => {
    Object.assign(window.location, { pathname: "/", search: "", href: "http://localhost:3000/" })

    await expect(cartCommands.addItem("up-1", 1)).rejects.toMatchObject({ authHandled: true })

    const target = String(assignMock.mock.calls[0][0])
    expect(target).not.toContain("redirect=")
    expect(target).toContain("reason=login-required")
  })
})

/**
 * old: "cartStore addToCart guest guard reads live auth state, not a stale snapshot"
 * The guard in `addItem` reads `useAuthStore.getState().isAuthenticated` live, not a value
 * captured earlier - a shopper who was signed in and then loses the session (token expiry,
 * cross-tab logout) must still be bounced on their very next `addItem` call, with no stale
 * "still authenticated" state carried over from before the session was cleared.
 */
describe("cartCommands.addItem guest guard reads live auth state, not a stale snapshot", () => {
  const assignMock = window.location.assign as unknown as ReturnType<typeof vi.fn>

  beforeEach(async () => {
    useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")
    cartResponse = makeCart({ cartItems: [makeCartItem({ id: "ci-1", quantity: 4 })] })
    await refreshCart()

    assignMock.mockClear()
    Object.assign(window.location, {
      pathname: "/products/p-1",
      search: "",
      href: "http://localhost:3000/products/p-1",
    })
  })

  it("redirects on the next addItem after the session is cleared, even though it was authenticated moments ago", async () => {
    expect(cached()?.cartItems).toHaveLength(1)
    useAuthStore.getState().clearAuth()

    await expect(cartCommands.addItem("up-2", 1)).rejects.toMatchObject({ authHandled: true })

    expect(counts.addItem).toBe(0)
    expect(assignMock).toHaveBeenCalledTimes(1)
    expect(String(assignMock.mock.calls[0][0])).toContain("reason=login-required")
  })

  it("leaves the cached cart exactly as it was", async () => {
    const before = cached()
    useAuthStore.getState().clearAuth()

    await expect(cartCommands.addItem("up-2", 1)).rejects.toMatchObject({ authHandled: true })

    expect(cached()).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// cartQueryOptions() itself - the queryOptions() factory used by future hooks (§5)
// ---------------------------------------------------------------------------
describe("cartQueryOptions", () => {
  it("uses the shared cart.detail() query key and a 1s staleTime", () => {
    const options = cartQueryOptions()

    expect(options.queryKey).toEqual(queryKeys.cart.detail())
    expect(options.staleTime).toBe(1_000)
  })
})
