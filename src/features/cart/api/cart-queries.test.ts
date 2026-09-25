import { CancelledError, type QueryClient } from "@tanstack/react-query"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type Cart, cartAPI } from "@/lib/api/cart"
import { mutationKeys, queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { seedCart } from "@/test/cart"
import { makeAccountUser, makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import {
  type CartData,
  cartCommands,
  cartQueryOptions,
  EMPTY_CART,
  fetchErrorMessage,
  getCartCommandName,
  refreshCart,
  writeErrorMessage,
} from "./cart-queries"

/**
 * Characterization of the cart query core (`refreshCart`, `cartQueryOptions`, `cartCommands`).
 * These suites assert HTTP call counts, not just cache state: the 1s dedup window and
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
// refreshCart 1s staleTime window
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

    // Boundary lock: the request goes out at exactly 1000ms. Native `staleTime` freshness math:
    // at 1000ms remaining-until-stale hits exactly 0, which counts as stale.
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
// refreshCart also arms the dedup window on a FAILED fetch ("a downed backend doesn't get
// hammered"). A query that only ever errored has no successful `dataUpdatedAt` for TanStack's own
// staleTime check to key off, so `refreshCart` tracks `errorUpdatedAt` itself for this case.
// ---------------------------------------------------------------------------
describe("refreshCart failure-side dedup window", () => {
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
// native QueryClient in-flight collapsing
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
   * The in-flight promise lives inside the `Query` instance, so there is no module-level guard
   * that could leak: a failed refresh does not wedge later refreshes (above), and a session clear
   * drops the in-flight request with the entry (`cart-session.test.tsx`).
   */
})

// ---------------------------------------------------------------------------
// cartQueryOptions()/refreshCart() error handling
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
   * Unlike a 400/404/500, an auth-handled 401 must NOT arm the failure-side dedup window:
   * re-stamping it would leave the user staring at an empty cart for ~1s right after the next
   * login. A plain refresh immediately after one must still go to the network.
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
// cartQueryOptions()/refreshCart() success state
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
// cartCommands.updateQuantity/addItem reading the cache
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

  it("fetches the cart first when it has not been cached yet, so a write-before-first-load does not wipe the schedule (design doc §10.4, fixed)", async () => {
    // Was: resolved autoOrder against an empty item list (same as the old store's initial
    // `items: []`), silently clearing whatever schedule the server already had for this item. Now
    // it ensures the cart is loaded before resolving, so the schedule already on the item survives
    // - at the cost of one extra GET (the ensure-fetch) alongside the usual post-write refresh.
    // This only happens on a genuinely cold cache (nothing fetched yet) - see the "warm-but-stale"
    // test below for the (far more common) case where the fix costs no extra request at all.
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })

    await cartCommands.addItem("up-1", 1)

    expect(counts.getCart).toBe(2) // ensure-fetch (cold cache) + forced refresh after the write
    expect(lastPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: "TWO_WEEKS" })
  })

  it("preserves the schedule for updateQuantity on a cold cache too", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "ONE_MONTH" })] })

    await cartCommands.updateQuantity("up-1", 5)

    expect(counts.getCart).toBe(2) // ensure-fetch (cold cache) + forced refresh after the write
    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 5, autoOrder: "ONE_MONTH" })
  })

  it("does not fetch before an addItem write when the cache is warm but stale (past the 1s dedup window)", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })
    // Seeds an entry well outside the 1s staleTime window, without counting as a GET - the real
    // `GET /cart` is multiple seconds, so this is the realistic steady state for most of a
    // session (a mount fetch happened once; the 1s window lapses almost immediately after).
    seedCart(client, cartResponse, { updatedAt: Date.now() - 60_000 })
    expect(counts.getCart).toBe(0)

    await cartCommands.addItem("up-1", 1)

    expect(counts.getCart).toBe(1) // only the forced refresh after the write - no ensure-fetch
    expect(lastPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: "TWO_WEEKS" })
  })

  it("does not fetch before an updateQuantity write when the cache is warm but stale", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })
    seedCart(client, cartResponse, { updatedAt: Date.now() - 60_000 })
    expect(counts.getCart).toBe(0)

    await cartCommands.updateQuantity("up-1", 5)

    expect(counts.getCart).toBe(1) // only the forced refresh after the write - no ensure-fetch
    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 5, autoOrder: "TWO_WEEKS" })
  })

  it("proceeds with autoOrder null, without throwing, when the cold-cache ensure-fetch itself fails", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))

    await expect(cartCommands.addItem("up-1", 1)).resolves.toBeUndefined()

    // Same fallback a cold cache produced before the fix - just reached via a failed fetch
    // instead of an absent one.
    expect(lastPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: null })
  })
})

// ---------------------------------------------------------------------------
// cartCommands.setItemAutoOrder
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
// cartCommands.addItem
// ---------------------------------------------------------------------------
describe("cartCommands.addItem error contract", () => {
  it("refreshes the cache after a successful add", async () => {
    // Warm, not cold: matches the realistic case (an owner has already fetched the cart at least
    // once), so `resolveAutoOrder`'s ensure-fetch (design doc §10.4) has nothing to do here - see
    // the "resolveAutoOrder" describe block above for the cold- and stale-cache cases on their own.
    seedCart(client, cartResponse)

    await cartCommands.addItem("up-1", 2)

    expect(counts.addItem).toBe(1)
    expect(counts.getCart).toBe(1) // just the post-write refresh
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
    // Warm, not cold - see the note on "refreshes the cache after a successful add" above.
    seedCart(client, cartResponse)
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
// cartCommands.removeItem
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
// cartCommands.updateQuantity
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
    // Warm, not cold - see the note on "refreshes the cache after a successful add" above.
    seedCart(client, cartResponse)
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(cartCommands.updateQuantity("up-1", 3)).resolves.toBeUndefined()
    expect(counts.getCart).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// cartCommands.clearCart
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
    // to the network instead of serving stale pre-clear data.
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
// Write observability: what `useCartPage` derives its loading state and write-error toast from
// ---------------------------------------------------------------------------
describe("cart writes in the MutationCache", () => {
  const writesInFlight = () => client.isMutating({ mutationKey: mutationKeys.cart.all })
  const cartFetching = () => client.isFetching({ queryKey: queryKeys.cart.detail() })

  /** Registers a handler that parks each request until released, and resolves `seen` on arrival. */
  function gate(method: "get" | "put" | "delete", path: string, respond: () => Response) {
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

  it("counts a write as in flight only during its request; the refresh then shows as the cart fetch", async () => {
    await refreshCart()
    const put = gate("put", "*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 }))
    const get = gate("get", "*/backend-api/cart", jsonCart)

    const pending = cartCommands.updateQuantity("up-1", 4)
    // Pending synchronously, before the first await - no idle gap at the start of a write.
    // `resolveAutoOrder`'s ensure-fetch step (fix, design doc §10.4) returns a plain value (not a
    // promise) when the cache is already warm, as it is here, so it costs no microtask either.
    expect(writesInFlight()).toBe(1)

    await put.seen
    expect([writesInFlight(), cartFetching()]).toEqual([1, 0])
    put.release()

    // Handover: the write has settled and the forced refresh is the cart query's own fetch -
    // exactly one of the two is "loading", never neither, never both.
    await get.seen
    expect([writesInFlight(), cartFetching()]).toEqual([0, 1])
    get.release()

    await pending
    expect([writesInFlight(), cartFetching()]).toEqual([0, 0])
  })

  it("clearCart is in flight during its request and settles together with the emptied cart", async () => {
    await refreshCart()
    const del = gate("delete", "*/backend-api/cart", () => new HttpResponse(null, { status: 200 }))

    const pending = cartCommands.clearCart()
    await del.seen
    expect(writesInFlight()).toBe(1)
    del.release()
    await pending

    expect(writesInFlight()).toBe(0)
    expect(cached()).toEqual(EMPTY_CART)
  })

  it("tags every write with its command name, so a failure can be attributed without the command rethrowing it", async () => {
    await refreshCart()
    server.use(http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await cartCommands.removeItem("up-1")

    const [failed] = client.getMutationCache().findAll({ mutationKey: mutationKeys.cart.all, status: "error" })
    expect(getCartCommandName(failed?.meta)).toBe("removeItem")
    expect(getCartCommandName({ cartCommand: "somethingElse" })).toBeUndefined()
    expect(getCartCommandName(undefined)).toBeUndefined()
  })

  it.each([
    ["removeItem", () => cartCommands.removeItem("up-1"), "delete", "*/backend-api/cart/items"],
    ["updateQuantity", () => cartCommands.updateQuantity("up-1", 3), "put", "*/backend-api/cart/items"],
    ["setItemAutoOrder", () => cartCommands.setItemAutoOrder("up-1", null), "put", "*/backend-api/cart/items"],
    ["clearCart", () => cartCommands.clearCart(), "delete", "*/backend-api/cart"],
  ] as const)(
    "%s: an auth-handled failure settles the write on its own, independent of the logout cascade",
    async (_name, run, method, path) => {
      await refreshCart()
      server.use(http[method](path, () => new HttpResponse(null, { status: 401 })))

      await run()

      expect(writesInFlight()).toBe(0)
    },
  )
})

// ---------------------------------------------------------------------------
// commands force refreshCart
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
 * The query cache and the commands keep whatever a request rejects with verbatim (the generic
 * toast fallback lives in `writeErrorMessage`/`fetchErrorMessage`, tested below): a non-Error
 * rejection must not crash anything, and `addItem` hands it back to the caller unchanged.
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
// cartCommands.addItem guest guard
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
    const target = String(assignMock.mock.calls[0]![0])
    expect(target).toContain("reason=login-required")
    expect(target).toContain(`redirect=${encodeURIComponent("/products/p-1?vendorId=up-1")}`)
  })

  it("omits the redirect param on the home page", async () => {
    Object.assign(window.location, { pathname: "/", search: "", href: "http://localhost:3000/" })

    await expect(cartCommands.addItem("up-1", 1)).rejects.toMatchObject({ authHandled: true })

    const target = String(assignMock.mock.calls[0]![0])
    expect(target).not.toContain("redirect=")
    expect(target).toContain("reason=login-required")
  })
})

/**
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
    expect(String(assignMock.mock.calls[0]![0])).toContain("reason=login-required")
  })

  it("leaves the cached cart exactly as it was", async () => {
    const before = cached()
    useAuthStore.getState().clearAuth()

    await expect(cartCommands.addItem("up-2", 1)).rejects.toMatchObject({ authHandled: true })

    expect(cached()).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// cartQueryOptions() - the one definition every reader, owner and command shares
// ---------------------------------------------------------------------------
describe("cartQueryOptions", () => {
  const cartQuery = () => client.getQueryCache().find({ queryKey: queryKeys.cart.detail(), exact: true })

  it("uses the shared cart.detail() query key and a 1s staleTime", () => {
    const options = cartQueryOptions()

    expect(options.queryKey).toEqual(queryKeys.cart.detail())
    expect(options.staleTime).toBe(1_000)
  })

  it("keeps the cart entry from ever being garbage-collected, also after clearCart rewrote it", async () => {
    await refreshCart()
    expect(cartQuery()?.gcTime).toBe(Number.POSITIVE_INFINITY)

    await cartCommands.clearCart()

    expect(cached()).toEqual(EMPTY_CART)
    expect(cartQuery()?.gcTime).toBe(Number.POSITIVE_INFINITY)
  })

  it("hands out a fresh cartItems array on every refetch (no structural sharing)", async () => {
    await refreshCart()
    const first = cached()?.cartItems

    await refreshCart({ force: true })

    expect(cached()?.cartItems).not.toBe(first)
    expect(cached()?.cartItems).toEqual(first)
  })
})

// ---------------------------------------------------------------------------
// writeErrorMessage / fetchErrorMessage - the toast-message rules behind useCartPage's
// fetch-error and write-error toasts.
// ---------------------------------------------------------------------------
describe("writeErrorMessage", () => {
  it.each([
    ["addItem", "Failed to add item"],
    ["removeItem", "Failed to remove item"],
    ["updateQuantity", "Failed to update quantity"],
    ["clearCart", "Failed to clear cart"],
  ] as const)("%s: an Error's own message wins over the fallback", (command, fallback) => {
    expect(writeErrorMessage(command, new Error("boom"))).toBe("boom")
    expect(fallback).not.toBe("boom") // sanity: fallback and message are actually different strings
  })

  it.each([
    ["addItem", "Failed to add item"],
    ["removeItem", "Failed to remove item"],
    ["updateQuantity", "Failed to update quantity"],
    ["clearCart", "Failed to clear cart"],
  ] as const)("%s: a non-Error rejection falls back to %s", (command, fallback) => {
    expect(writeErrorMessage(command, "just a string")).toBe(fallback)
    expect(writeErrorMessage(command, { weird: true })).toBe(fallback)
  })

  it.each(["addItem", "removeItem", "updateQuantity", "clearCart"] as const)(
    "%s: an auth-handled error is silent (undefined)",
    (command) => {
      expect(writeErrorMessage(command, Object.assign(new Error("boom"), { authHandled: true }))).toBeUndefined()
    },
  )

  it("setItemAutoOrder never produces a message - its caller owns that toast", () => {
    expect(writeErrorMessage("setItemAutoOrder", new Error("boom"))).toBeUndefined()
    expect(writeErrorMessage("setItemAutoOrder", "just a string")).toBeUndefined()
    expect(
      writeErrorMessage("setItemAutoOrder", Object.assign(new Error("boom"), { authHandled: true })),
    ).toBeUndefined()
  })

  // addToCart alone also treats a bare 401 (not yet flagged `authHandled` by the interceptor) as
  // an auth failure - every other command surfaces a bare 401 as a normal, message-bearing error.
  it("addItem: a bare 401 status is silent even without the interceptor's authHandled flag", () => {
    const bare401 = Object.assign(new Error("boom"), { response: { status: 401 } })
    expect(writeErrorMessage("addItem", bare401)).toBeUndefined()
  })

  it.each(["removeItem", "updateQuantity", "clearCart"] as const)(
    "%s: a bare 401 status is NOT treated as auth - it still produces a message",
    (command) => {
      const bare401 = Object.assign(new Error("boom"), { response: { status: 401 } })
      expect(writeErrorMessage(command, bare401)).toBe("boom")
    },
  )
})

describe("fetchErrorMessage", () => {
  it("an Error's own message wins over the fallback", () => {
    expect(fetchErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("a non-Error rejection falls back to a generic message", () => {
    expect(fetchErrorMessage("just a string")).toBe("Failed to fetch cart")
    expect(fetchErrorMessage({ weird: true })).toBe("Failed to fetch cart")
  })

  it("an auth-handled error is silent (undefined)", () => {
    expect(fetchErrorMessage(Object.assign(new Error("boom"), { authHandled: true }))).toBeUndefined()
  })

  it("a cancelled fetch is silent (undefined)", () => {
    expect(fetchErrorMessage(new CancelledError())).toBeUndefined()
  })
})
