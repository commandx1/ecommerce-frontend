import { act, renderHook } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { resetAllStores } from "@/test/store-reset"
import { useFavoriteProductsStore, useIsFavoriteProduct } from "./favoriteProductsStore"

const store = () => useFavoriteProductsStore.getState()

let getIdsCount: number

beforeEach(() => {
  resetAllStores()
  getIdsCount = 0

  server.use(
    http.get("*/backend-api/products/favorite-ids", () => {
      getIdsCount += 1
      return HttpResponse.json(["p-1"])
    }),
    http.post("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 200 })),
    http.delete("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 200 })),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Holds the GET open so overlapping callers are guaranteed to be concurrent. */
function gateGetIds(ids: string[] = ["p-1"]): { release: () => void } {
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  server.use(
    http.get("*/backend-api/products/favorite-ids", async () => {
      getIdsCount += 1
      await gate
      return HttpResponse.json(ids)
    }),
  )

  return { release }
}

describe("favoriteProductsStore hydrate", () => {
  it("collapses two same-tick hydrate calls into a single GET", async () => {
    const { release } = gateGetIds()

    const first = store().hydrate()
    const second = store().hydrate()
    release()
    await Promise.all([first, second])

    expect(getIdsCount).toBe(1)
    expect(store().ids.has("p-1")).toBe(true)
  })

  it("issues no request for a third hydrate call once the store has already hydrated", async () => {
    await store().hydrate()
    expect(getIdsCount).toBe(1)

    await store().hydrate()

    expect(getIdsCount).toBe(1)
  })

  it("leaves hasHydrated false on a failed GET, so a later hydrate retries", async () => {
    server.use(http.get("*/backend-api/products/favorite-ids", () => new HttpResponse(null, { status: 500 })))

    await store().hydrate()

    expect(store().hasHydrated).toBe(false)

    server.use(
      http.get("*/backend-api/products/favorite-ids", () => {
        getIdsCount += 1
        return HttpResponse.json(["p-1"])
      }),
    )
    await store().hydrate()

    expect(getIdsCount).toBe(1)
    expect(store().hasHydrated).toBe(true)
    expect(store().ids.has("p-1")).toBe(true)
  })

  it("reflects the ids returned by the favorite-ids response", async () => {
    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(["p-1", "p-2"])))

    await store().hydrate()

    expect(Array.from(store().ids).sort()).toEqual(["p-1", "p-2"])
    expect(store().hasHydrated).toBe(true)
  })

  it("keeps a favorite the user added while the hydrate GET was still in flight", async () => {
    const { release } = gateGetIds([])

    const hydrating = store().hydrate()
    await store().toggle("p-2")
    release()
    await hydrating

    expect(store().hasHydrated).toBe(true)
    expect(store().ids.has("p-2")).toBe(true)
  })

  it("keeps a removal the user made while the hydrate GET was still in flight", async () => {
    const { release } = gateGetIds()

    const hydrating = store().hydrate()
    store().setFavorite("p-1", true)
    await store().toggle("p-1")
    release()
    await hydrating

    expect(store().ids.has("p-1")).toBe(false)
  })

  it("ignores a hydrate GET that resolves after a logout reset, so a previous user's favorites never leak", async () => {
    const { release: releaseUserA } = gateGetIds(["a-1"])
    const hydratingUserA = store().hydrate()
    // Wait for user A's request to actually reach the gated handler before switching users, so it
    // is genuinely in flight (not merely queued) when reset() runs below.
    await vi.waitFor(() => expect(getIdsCount).toBe(1))

    store().reset()

    server.use(
      http.get("*/backend-api/products/favorite-ids", () => {
        getIdsCount += 1
        return HttpResponse.json(["b-1"])
      }),
    )
    await store().hydrate()

    expect(store().ids.has("b-1")).toBe(true)

    releaseUserA()
    await hydratingUserA

    expect(Array.from(store().ids)).toEqual(["b-1"])
    expect(store().ids.has("a-1")).toBe(false)
    expect(store().hasHydrated).toBe(true)
  })

  it("clears the in-flight guard on reset so a fresh hydrate issues a new request", async () => {
    await store().hydrate()
    expect(getIdsCount).toBe(1)

    store().reset()
    expect(store().hasHydrated).toBe(false)

    await store().hydrate()

    expect(getIdsCount).toBe(2)
  })

  it("hydrate({ force: true }) re-fetches even though the store already hydrated", async () => {
    await store().hydrate()
    expect(getIdsCount).toBe(1)
    expect(store().hasHydrated).toBe(true)

    await store().hydrate({ force: true })

    expect(getIdsCount).toBe(2)
  })

  it("hydrate({ force: true }) picks up ids that changed on another device since the last hydrate", async () => {
    await store().hydrate()
    expect(store().ids.has("p-1")).toBe(true)

    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(["p-2"])))
    await store().hydrate({ force: true })

    expect(Array.from(store().ids)).toEqual(["p-2"])
  })

  it("a plain hydrate() call still only fetches once even after a forced hydrate", async () => {
    await store().hydrate({ force: true })
    expect(getIdsCount).toBe(1)

    await store().hydrate()

    expect(getIdsCount).toBe(1)
  })
})

describe("favoriteProductsStore lastLocalWriteAt", () => {
  // `useAuthHydration` watches this field (not `ids`) to know when to broadcast a cross-tab
  // change - see its own tests for the broadcast/ignore behaviour that depends on it.
  it("bumps on toggle, its rollback, and setFavorite", async () => {
    expect(store().lastLocalWriteAt).toBe(0)

    store().setFavorite("p-1", true)
    const afterSetFavorite = store().lastLocalWriteAt
    expect(afterSetFavorite).toBeGreaterThan(0)

    await store().toggle("p-1")
    const afterToggle = store().lastLocalWriteAt
    expect(afterToggle).toBeGreaterThanOrEqual(afterSetFavorite)

    server.use(http.post("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 500 })))
    await expect(store().toggle("p-2")).rejects.toBeInstanceOf(Error)
    expect(store().lastLocalWriteAt).toBeGreaterThanOrEqual(afterToggle)
  })

  it("does not bump for hydrate's own snapshot merge", async () => {
    await store().hydrate()

    expect(store().lastLocalWriteAt).toBe(0)
  })
})

describe("favoriteProductsStore toggle", () => {
  it("optimistically marks a product favorite before the POST resolves, then resolves true", async () => {
    const promise = store().toggle("p-1")
    expect(store().ids.has("p-1")).toBe(true)

    const result = await promise
    expect(result).toBe(true)
  })

  it("sends exactly one POST when adding a new favorite", async () => {
    let postCount = 0
    server.use(
      http.post("*/backend-api/products/:productId/favorite", () => {
        postCount += 1
        return new HttpResponse(null, { status: 200 })
      }),
    )

    await store().toggle("p-1")

    expect(postCount).toBe(1)
  })

  it("sends a DELETE and resolves false when removing an existing favorite", async () => {
    store().setFavorite("p-1", true)
    let deleteCount = 0
    server.use(
      http.delete("*/backend-api/products/:productId/favorite", () => {
        deleteCount += 1
        return new HttpResponse(null, { status: 200 })
      }),
    )

    const result = await store().toggle("p-1")

    expect(result).toBe(false)
    expect(deleteCount).toBe(1)
    expect(store().ids.has("p-1")).toBe(false)
  })

  it("rolls back to not-favorite and rejects when the add POST fails", async () => {
    server.use(http.post("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 500 })))

    await expect(store().toggle("p-1")).rejects.toBeInstanceOf(Error)

    expect(store().ids.has("p-1")).toBe(false)
  })

  it("rolls back to favorite and rejects when the remove DELETE fails", async () => {
    store().setFavorite("p-1", true)
    server.use(http.delete("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 500 })))

    await expect(store().toggle("p-1")).rejects.toBeInstanceOf(Error)

    expect(store().ids.has("p-1")).toBe(true)
  })
})

describe("favoriteProductsStore reset", () => {
  it("clears ids and hasHydrated", async () => {
    await store().hydrate()
    expect(store().ids.size).toBeGreaterThan(0)
    expect(store().hasHydrated).toBe(true)

    store().reset()

    expect(store().ids.size).toBe(0)
    expect(store().hasHydrated).toBe(false)
  })
})

describe("useIsFavoriteProduct", () => {
  it("re-renders from false to true after setFavorite marks the product", () => {
    const { result, rerender } = renderHook(() => useIsFavoriteProduct("p-1"))

    expect(result.current).toBe(false)

    act(() => {
      store().setFavorite("p-1", true)
    })
    rerender()

    expect(result.current).toBe(true)
  })
})
