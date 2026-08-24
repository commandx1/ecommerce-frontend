import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type Cart, cartAPI } from "@/lib/api/cart"
import { server } from "@/mocks/server"
import { makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { useCartStore } from "./cartStore"

/**
 * These suites assert HTTP call counts, not just store state: the de-duplication window and the
 * in-flight guard are invisible in state (both paths end with the same items), so a regression
 * that silently fires a second request would pass a state-only assertion.
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

const store = () => useCartStore.getState()

function jsonCart(): Response {
  return HttpResponse.json(cartResponse)
}

beforeEach(() => {
  counts = { getCart: 0, addItem: 0, updateItem: 0, removeItem: 0, clearCart: 0 }
  lastPostBody = null
  lastPutBody = null
  cartResponse = makeCart()

  server.use(
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

describe("cartStore fetchCart de-duplication window", () => {
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

  it("skips the request when a second fetch lands 500ms after the first", async () => {
    await store().fetchCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date(baseTime + 500))
    await store().fetchCart()

    expect(counts.getCart).toBe(1)
  })

  it("issues the request again once the window has elapsed (1001ms)", async () => {
    await store().fetchCart()

    vi.setSystemTime(new Date(baseTime + 1001))
    await store().fetchCart()

    expect(counts.getCart).toBe(2)
  })

  it("fires at exactly 1000ms because the guard is a strict less-than", async () => {
    await store().fetchCart()

    // Boundary lock: `now - lastFetchedAt < 1000` is false at exactly 1000ms, so the request
    // GOES OUT. An off-by-one regression (`<=`) would swallow it.
    vi.setSystemTime(new Date(baseTime + 1000))
    await store().fetchCart()

    expect(counts.getCart).toBe(2)
  })

  it("does not fire at 999ms", async () => {
    await store().fetchCart()

    vi.setSystemTime(new Date(baseTime + 999))
    await store().fetchCart()

    expect(counts.getCart).toBe(1)
  })

  it("always requests when force is set, even inside the window", async () => {
    await store().fetchCart()

    vi.setSystemTime(new Date(baseTime + 10))
    await store().fetchCart({ force: true })
    await store().fetchCart({ force: true })

    expect(counts.getCart).toBe(3)
  })
})

describe("cartStore fetchCart in-flight de-duplication", () => {
  it("collapses two same-tick fetches into a single request", async () => {
    const { release } = gateGetCart()

    const first = store().fetchCart()
    const second = store().fetchCart()
    release()
    await Promise.all([first, second])

    expect(counts.getCart).toBe(1)
  })

  it("lets a third caller ride the same in-flight promise under a slow response", async () => {
    const { release } = gateGetCart()

    const first = store().fetchCart()
    const second = store().fetchCart()
    const third = store().fetchCart()
    release()
    await Promise.all([first, second, third])

    expect(counts.getCart).toBe(1)
    expect(store().items).toHaveLength(1)
  })

  it("de-duplicates concurrent force fetches against an in-flight plain fetch - one request goes out", async () => {
    const { release } = gateGetCart()

    // `force: true` only skips the dedup *window* check, not the in-flight guard. If a request
    // is already flying, a forced call joins it instead of racing a second GET whose response
    // could land first and stomp the newer one's state.
    const first = store().fetchCart({ force: true })
    const second = store().fetchCart({ force: true })
    release()
    await Promise.all([first, second])

    expect(counts.getCart).toBe(1)
  })

  it("does not leave a stale in-flight guard after a failed request", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))
    await store().fetchCart()
    expect(store().error).not.toBeNull()

    // The module-level `inFlightCartFetch` is cleared in `finally`, so a leaked promise cannot
    // swallow the next call. The failed fetch above now arms the dedup window (see the error
    // matrix suite below), so this call must force past it to prove the *guard* was cleared.
    server.use(
      http.get("*/backend-api/cart", () => {
        counts.getCart += 1
        return jsonCart()
      }),
    )
    await store().fetchCart({ force: true })

    expect(counts.getCart).toBe(1)
    expect(store().error).toBeNull()
  })

  it("clears the in-flight guard on resetCart so the next fetch is not swallowed", async () => {
    const { release } = gateGetCart()

    const first = store().fetchCart()
    store().resetCart()
    const second = store().fetchCart()
    release()
    await Promise.all([first, second])

    expect(counts.getCart).toBe(2)
  })
})

describe("cartStore fetchCart error matrix", () => {
  it("treats 404 as an empty cart without setting an error", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 404 })))

    await store().fetchCart()

    expect(store().items).toEqual([])
    expect(store().cartCount).toBe(0)
    expect(store().cartId).toBeNull()
    expect(store().error).toBeNull()
    expect(store().isLoading).toBe(false)
    expect(store().lastFetchedAt).toBeGreaterThan(0)
  })

  it("treats 400 as an empty cart without setting an error", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 400 })))

    await store().fetchCart()

    expect(store().items).toEqual([])
    expect(store().cartId).toBeNull()
    expect(store().error).toBeNull()
    expect(store().lastFetchedAt).toBeGreaterThan(0)
  })

  it("sets an error on 500 and still arms the dedup window", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))

    await store().fetchCart()

    expect(store().error).toBe("Request failed with status code 500")
    expect(store().isLoading).toBe(false)
    // The failure path now stamps `lastFetchedAt` too (same window as the success path), so a
    // downed backend doesn't get hammered by an uninterrupted stream of retries.
    expect(store().lastFetchedAt).toBeGreaterThan(0)
  })

  it("does not retry within the dedup window after a 500 - force is required", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))
    await store().fetchCart()

    server.use(
      http.get("*/backend-api/cart", () => {
        counts.getCart += 1
        return jsonCart()
      }),
    )
    await store().fetchCart()
    expect(counts.getCart).toBe(0)
    expect(store().items).toHaveLength(0)

    await store().fetchCart({ force: true })
    expect(counts.getCart).toBe(1)
    expect(store().items).toHaveLength(1)
  })

  it("swallows an auth-handled 401 without an error and leaves the window cleared by resetCart", async () => {
    server.use(http.get("*/backend-api/cart", () => new HttpResponse(null, { status: 401 })))

    await store().fetchCart()

    expect(store().error).toBeNull()
    expect(store().isLoading).toBe(false)
    // The auth interceptor's `resetCart()` runs (zeroing `lastFetchedAt`) before this rejection
    // reaches fetchCart's own catch block. Re-stamping "now" here would re-open the dedup window
    // and leave the user staring at an empty cart for ~1s right after login.
    expect(store().lastFetchedAt).toBe(0)
  })
})

describe("cartStore fetchCart success state", () => {
  it("derives cartCount from the sum of quantities, not the item count", async () => {
    cartResponse = makeCart({
      cartItems: [
        makeCartItem({ id: "ci-1", quantity: 3, userProduct: makeCartUserProduct({ userProductId: "up-1" }) }),
        makeCartItem({ id: "ci-2", quantity: 3, userProduct: makeCartUserProduct({ userProductId: "up-2" }) }),
      ],
    })

    await store().fetchCart()

    expect(store().items).toHaveLength(2)
    expect(store().cartCount).toBe(6)
  })

  it("stores the cartId and clears isLoading", async () => {
    await store().fetchCart()

    expect(store().cartId).toBe(cartResponse.cartId)
    expect(store().isLoading).toBe(false)
    expect(store().error).toBeNull()
  })
})

describe("cartStore resolveAutoOrder", () => {
  it("resends the schedule already on the item when autoOrder is omitted", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })
    await store().fetchCart()

    await store().updateQuantity("up-1", 5)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 5, autoOrder: "TWO_WEEKS" })
  })

  it("falls back to null when the product is not in the cart", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "TWO_WEEKS" })] })
    await store().fetchCart()

    await store().addToCart("up-unknown", 2)

    expect(lastPostBody).toEqual({ userProductId: "up-unknown", quantity: 2, autoOrder: null })
  })

  it("clears the schedule when null is passed explicitly", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ autoOrder: "ONE_MONTH" })] })
    await store().fetchCart()

    await store().updateQuantity("up-1", 4, null)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 4, autoOrder: null })
  })
})

describe("cartStore setItemAutoOrder", () => {
  beforeEach(async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ quantity: 2, autoOrder: "TWO_WEEKS" })] })
    await store().fetchCart()
  })

  it("is a silent no-op for a product that is not in the cart", async () => {
    const before = store().items

    await store().setItemAutoOrder("up-not-there", "ONE_MONTH")

    expect(counts.updateItem).toBe(0)
    expect(counts.removeItem).toBe(0)
    expect(store().items).toBe(before)
    expect(store().isLoading).toBe(false)
    expect(store().error).toBeNull()
  })

  it("reuses the item's current quantity when none is given", async () => {
    await store().setItemAutoOrder("up-1", "ONE_MONTH")

    // A schedule-only edit must not overwrite a quantity the user is still debouncing.
    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: "ONE_MONTH" })
  })

  it("flushes an explicit quantity in the same write", async () => {
    await store().setItemAutoOrder("up-1", "ONE_MONTH", 7)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 7, autoOrder: "ONE_MONTH" })
  })

  it("sends an explicit null to clear the schedule", async () => {
    await store().setItemAutoOrder("up-1", null)

    expect(lastPutBody).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: null })
  })

  it("delegates to removeFromCart when the resolved quantity is zero", async () => {
    await store().setItemAutoOrder("up-1", "ONE_MONTH", 0)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("delegates to removeFromCart for a negative quantity", async () => {
    await store().setItemAutoOrder("up-1", null, -3)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("rethrows a non-auth failure and clears isLoading WITHOUT writing the shared error state", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(store().setItemAutoOrder("up-1", "ONE_MONTH")).rejects.toThrow()
    expect(store().isLoading).toBe(false)
    // Guards a deliberate asymmetry with `addToCart`: useCartPage renders a generic
    // "Cart unavailable" toast whenever `error` changes AND its own "Could not update
    // auto-reorder" toast off this rethrow. Writing `error` here fires both for one failure.
    expect(store().error).toBeNull()
  })

  it("swallows an auth-handled failure without rethrowing", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(store().setItemAutoOrder("up-1", "ONE_MONTH")).resolves.toBeUndefined()
    expect(store().isLoading).toBe(false)
  })
})

describe("cartStore addToCart error contract", () => {
  it("refetches the cart after a successful add", async () => {
    await store().addToCart("up-1", 2)

    expect(counts.addItem).toBe(1)
    expect(counts.getCart).toBe(1)
    expect(store().items).toHaveLength(1)
  })

  it("throws on an auth-handled 401", async () => {
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(store().addToCart("up-1", 1)).rejects.toThrow()
  })

  /**
   * REGRESSION GUARD (K11): a failed add used to be swallowed here, so the caller's catch block
   * never ran — the spinner just stopped, no warning was shown and the item was not in the cart.
   * The error state is still recorded, but the rejection now reaches the caller as well.
   */
  it("records a 403 in the error state AND rethrows so the caller can warn", async () => {
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 403 })))

    await expect(store().addToCart("up-1", 1)).rejects.toThrow()
    // 403 is a business-rule rejection, not an expired session, so it is shown inline too.
    expect(store().error).toBe("Request failed with status code 403")
    expect(store().isLoading).toBe(false)
  })

  it("records a 500 in the error state AND rethrows so the caller can warn", async () => {
    server.use(http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(store().addToCart("up-1", 1)).rejects.toThrow()
    expect(store().error).toBe("Request failed with status code 500")
    expect(store().isLoading).toBe(false)
  })

  it("defaults the quantity to 1", async () => {
    await store().addToCart("up-1")

    expect(lastPostBody).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: null })
  })
})

describe("cartStore removeFromCart error contract", () => {
  it("refetches after a successful remove", async () => {
    await store().removeFromCart("up-1")

    expect(counts.removeItem).toBe(1)
    expect(counts.getCart).toBe(1)
  })

  it("returns silently on an auth-handled 401 - no throw, no error state", async () => {
    server.use(http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(store().removeFromCart("up-1")).resolves.toBeUndefined()
    expect(store().error).toBeNull()
    expect(store().isLoading).toBe(false)
  })

  it("records a 500 as an error state", async () => {
    server.use(http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await store().removeFromCart("up-1")

    expect(store().error).toBe("Request failed with status code 500")
    expect(store().isLoading).toBe(false)
  })
})

describe("cartStore updateQuantity error contract", () => {
  it("delegates to removeFromCart at quantity 0", async () => {
    await store().updateQuantity("up-1", 0)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("delegates to removeFromCart for a negative quantity", async () => {
    await store().updateQuantity("up-1", -1)

    expect(counts.removeItem).toBe(1)
    expect(counts.updateItem).toBe(0)
  })

  it("returns silently on an auth-handled 401 - no throw, no error state", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 401 })))

    await expect(store().updateQuantity("up-1", 3)).resolves.toBeUndefined()
    expect(store().error).toBeNull()
    expect(store().isLoading).toBe(false)
  })

  it("records a 500 as an error state without throwing", async () => {
    server.use(http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 500 })))

    await expect(store().updateQuantity("up-1", 3)).resolves.toBeUndefined()
    expect(store().error).toBe("Request failed with status code 500")
    expect(store().isLoading).toBe(false)
  })
})

describe("cartStore clearCart", () => {
  it("is a no-op while cartId is null", async () => {
    expect(store().cartId).toBeNull()

    await store().clearCart()

    expect(counts.clearCart).toBe(0)
    expect(store().isLoading).toBe(false)
  })

  it("empties the local cart after a successful clear", async () => {
    await store().fetchCart()
    expect(store().cartId).not.toBeNull()

    await store().clearCart()

    expect(counts.clearCart).toBe(1)
    expect(store().items).toEqual([])
    expect(store().cartCount).toBe(0)
    expect(store().cartId).toBeNull()
    // No refetch here, unlike the item mutations.
    expect(counts.getCart).toBe(1)
    // The dedup window is invalidated (not a self-triggered refetch) so the next `fetchCart()`
    // actually goes to the network instead of returning now-stale pre-clear data.
    expect(store().lastFetchedAt).toBe(0)

    await store().fetchCart()
    expect(counts.getCart).toBe(2)
  })

  it("returns silently on an auth-handled 401", async () => {
    await store().fetchCart()
    server.use(http.delete("*/backend-api/cart", () => new HttpResponse(null, { status: 401 })))

    await store().clearCart()

    expect(store().error).toBeNull()
    expect(store().isLoading).toBe(false)
  })

  it("records a 500 as an error state and keeps the items", async () => {
    await store().fetchCart()
    server.use(http.delete("*/backend-api/cart", () => new HttpResponse(null, { status: 500 })))

    await store().clearCart()

    expect(store().error).toBe("Request failed with status code 500")
    expect(store().items).toHaveLength(1)
    expect(store().isLoading).toBe(false)
  })
})

describe("cartStore resetCart", () => {
  it("returns every field to its initial value", async () => {
    await store().fetchCart()
    expect(store().cartCount).toBeGreaterThan(0)

    store().resetCart()

    expect(store()).toMatchObject({
      cartId: null,
      items: [],
      cartCount: 0,
      isLoading: false,
      error: null,
      lastFetchedAt: 0,
    })
  })
})

/**
 * `getInitialState()` returns the object the creator produced at module load, unaffected by
 * whatever a previous test in this file left in the live singleton.
 */
describe("cartStore defaults", () => {
  it("starts isLoading false before any fetch is triggered", () => {
    expect(useCartStore.getInitialState().isLoading).toBe(false)
  })
})

/**
 * Every mutator's very first statement is a synchronous `set({ isLoading: true, error: null })`,
 * executed before the mutator's first `await` — so the store already reflects it the instant the
 * call returns a promise, with no need to await or gate the network. These tests catch a mutant
 * that turns that `set` into a no-op or flips `isLoading` to `false`, which every other test in
 * this file misses because they only assert the settled state once the whole call has resolved.
 */
describe("cartStore transient isLoading/error at the start of a write", () => {
  it("fetchCart", async () => {
    useCartStore.setState({ error: "stale", isLoading: false })
    const promise = store().fetchCart({ force: true })

    expect(store().isLoading).toBe(true)
    expect(store().error).toBeNull()

    await promise
  })

  it("addToCart", async () => {
    useCartStore.setState({ error: "stale", isLoading: false })
    const promise = store().addToCart("up-1", 1)

    expect(store().isLoading).toBe(true)
    expect(store().error).toBeNull()

    await promise
  })

  it("removeFromCart", async () => {
    useCartStore.setState({ error: "stale", isLoading: false })
    const promise = store().removeFromCart("up-1")

    expect(store().isLoading).toBe(true)
    expect(store().error).toBeNull()

    await promise
  })

  it("updateQuantity", async () => {
    useCartStore.setState({ error: "stale", isLoading: false })
    const promise = store().updateQuantity("up-1", 3)

    expect(store().isLoading).toBe(true)
    expect(store().error).toBeNull()

    await promise
  })

  it("setItemAutoOrder", async () => {
    cartResponse = makeCart({ cartItems: [makeCartItem({ quantity: 2 })] })
    await store().fetchCart()
    useCartStore.setState({ error: "stale", isLoading: false })

    const promise = store().setItemAutoOrder("up-1", "ONE_MONTH")

    expect(store().isLoading).toBe(true)
    expect(store().error).toBeNull()

    await promise
  })

  it("clearCart", async () => {
    await store().fetchCart()
    useCartStore.setState({ error: "stale", isLoading: false })

    const promise = store().clearCart()

    expect(store().isLoading).toBe(true)
    expect(store().error).toBeNull()

    await promise
  })
})

/**
 * `addToCart`, `updateQuantity` and `setItemAutoOrder` refetch with `{ force: true }` after a
 * successful write specifically so the new item shows up even inside the 1s de-dup window. A
 * mutant that drops `force` (or flips it to `false`) is invisible to a test that calls these
 * methods in isolation, because with no prior fetch there is no window to bypass in the first
 * place. Arming the window with a real `fetchCart()` first, then immediately writing, is what
 * makes the difference observable.
 */
describe("cartStore post-write refetch bypasses the de-dup window", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-08-22T10:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("addToCart", async () => {
    await store().fetchCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date("2026-08-22T10:00:00.100Z"))
    await store().addToCart("up-1", 1)

    expect(counts.getCart).toBe(2)
  })

  it("updateQuantity", async () => {
    await store().fetchCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date("2026-08-22T10:00:00.100Z"))
    await store().updateQuantity("up-1", 3)

    expect(counts.getCart).toBe(2)
  })

  it("setItemAutoOrder", async () => {
    cartResponse = makeCart({
      cartItems: [makeCartItem({ quantity: 2, userProduct: makeCartUserProduct({ userProductId: "up-1" }) })],
    })
    await store().fetchCart()
    expect(counts.getCart).toBe(1)

    vi.setSystemTime(new Date("2026-08-22T10:00:00.100Z"))
    await store().setItemAutoOrder("up-1", "ONE_MONTH")

    expect(counts.getCart).toBe(2)
  })
})

describe("cartStore fetchCart force joins the shared in-flight guard", () => {
  it("a concurrent plain fetch is deduped against a forced fetch's in-flight request", async () => {
    const { release } = gateGetCart()

    // `force: true` only bypasses the dedup *window*; it must still join an already-flying
    // request rather than racing a second GET whose response could land first and overwrite the
    // newer state (the "last response wins" race this fix closes).
    const forced = store().fetchCart({ force: true })
    const plain = store().fetchCart()
    release()
    await Promise.all([forced, plain])

    expect(counts.getCart).toBe(1)
  })
})

/**
 * `isAuthErrorStatus` only ever returns true for a 401, and the axios interceptor in
 * `lib/api/client.ts` sets `error.authHandled = true` on every 401 before the rejection reaches
 * the store - so in real traffic the two checks in `addToCart`'s catch block always agree. Mocking
 * `cartAPI.addItem` directly (instead of going through MSW/axios) bypasses that interceptor,
 * which is the only way to pull the two checks apart and prove each one independently guards the
 * throw.
 */
describe("cartStore addToCart auth checks are each independently load-bearing", () => {
  it("still throws when the interceptor already marked the error auth-handled, even at a non-401 status", async () => {
    const fakeError = Object.assign(new Error("weird"), { authHandled: true, response: { status: 500 } })
    vi.spyOn(cartAPI, "addItem").mockRejectedValueOnce(fakeError)

    await expect(store().addToCart("up-1", 1)).rejects.toBe(fakeError)
  })

  it("still throws on a 401 even when the interceptor has not marked it auth-handled", async () => {
    const fakeError = Object.assign(new Error("weird"), { response: { status: 401 } })
    vi.spyOn(cartAPI, "addItem").mockRejectedValueOnce(fakeError)

    await expect(store().addToCart("up-1", 1)).rejects.toBe(fakeError)
  })
})

/**
 * The auth-handled branches in `removeFromCart`/`updateQuantity`/`clearCart` reset `isLoading`
 * themselves - but in real 401 traffic that reset is masked by a second mechanism: the axios
 * interceptor's `handleAuthFailure()` already runs `useAuthStore.getState().logout()`, which
 * resets this whole store (including `isLoading`) via `resetAllStores`-style cascading before the
 * store's own catch block even executes. Mocking the `cartAPI` method directly bypasses that
 * interceptor, isolating the store's own reset so a mutant that empties it is actually observable.
 */
describe("cartStore auth-handled branches reset isLoading on their own, independent of the logout cascade", () => {
  it("removeFromCart", async () => {
    const fakeError = Object.assign(new Error("session"), { authHandled: true })
    vi.spyOn(cartAPI, "removeItem").mockRejectedValueOnce(fakeError)

    await store().removeFromCart("up-1")

    expect(store().isLoading).toBe(false)
  })

  it("updateQuantity", async () => {
    const fakeError = Object.assign(new Error("session"), { authHandled: true })
    vi.spyOn(cartAPI, "updateItemQuantity").mockRejectedValueOnce(fakeError)

    await store().updateQuantity("up-1", 3)

    expect(store().isLoading).toBe(false)
  })

  it("clearCart", async () => {
    await store().fetchCart()
    const fakeError = Object.assign(new Error("session"), { authHandled: true })
    vi.spyOn(cartAPI, "clearCart").mockRejectedValueOnce(fakeError)

    await store().clearCart()

    expect(store().isLoading).toBe(false)
  })
})

/**
 * A real HTTP failure via axios always rejects with an `Error` instance (`AxiosError` extends
 * `Error`), so the `error instanceof Error ? error.message : "<generic>"` fallback branch in each
 * catch block is unreachable through MSW. Mocking the `cartAPI` method to reject with a bare
 * string is the only way to exercise the non-Error side of that ternary.
 */
describe("cartStore generic error message fallback for a non-Error rejection", () => {
  it("fetchCart", async () => {
    vi.spyOn(cartAPI, "getCart").mockRejectedValueOnce("network exploded")

    await store().fetchCart()

    expect(store().error).toBe("Failed to fetch cart")
  })

  it("addToCart", async () => {
    vi.spyOn(cartAPI, "addItem").mockRejectedValueOnce("network exploded")

    await expect(store().addToCart("up-1", 1)).rejects.toBe("network exploded")

    expect(store().error).toBe("Failed to add item")
  })

  it("removeFromCart", async () => {
    vi.spyOn(cartAPI, "removeItem").mockRejectedValueOnce("network exploded")

    await store().removeFromCart("up-1")

    expect(store().error).toBe("Failed to remove item")
  })

  it("updateQuantity", async () => {
    vi.spyOn(cartAPI, "updateItemQuantity").mockRejectedValueOnce("network exploded")

    await store().updateQuantity("up-1", 3)

    expect(store().error).toBe("Failed to update quantity")
  })

  it("clearCart", async () => {
    await store().fetchCart()
    vi.spyOn(cartAPI, "clearCart").mockRejectedValueOnce("network exploded")

    await store().clearCart()

    expect(store().error).toBe("Failed to clear cart")
  })
})
