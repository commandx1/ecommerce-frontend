import { act, renderHook, waitFor } from "@testing-library/react"
import { delay, HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeBuyerOrder, makeBuyerOrdersResponse } from "@/test/factories"
import { setPathname, setSearchParams } from "@/test/mocks/next-navigation"
import { createQueryWrapper } from "@/test/render"
import { resetAllStores } from "@/test/store-reset"
import { useBuyerOrdersQuery } from "./useBuyerOrdersQuery"

const mockToastError = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: { error: (...args: unknown[]) => mockToastError(...args) },
}))

/** Counts every `GET /orders/buyer` the hook makes and always serves one order, mirroring the
 * `/cards` and `/auto-orders` counters from the earlier B2/B3 characterizations. */
const serveOrdersWithGetCount = () => {
  const state = { count: 0 }
  server.use(
    http.get("*/backend-api/orders/buyer", () => {
      state.count += 1
      return HttpResponse.json(makeBuyerOrdersResponse({ orders: [makeBuyerOrder()] }))
    }),
  )
  return state
}

describe("useBuyerOrdersQuery", () => {
  beforeEach(() => {
    mockToastError.mockReset()
    resetAllStores()
    setPathname("/buyer-dashboard/orders")
  })

  it("never calls the API when unauthenticated, and isLoading stays true", async () => {
    const counter = serveOrdersWithGetCount()

    const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(counter.count).toBe(0)
  })

  describe("authenticated", () => {
    beforeEach(() => {
      useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")
    })

    it("mount fires exactly one GET with the default tab/page/sort", async () => {
      const counter = serveOrdersWithGetCount()

      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(counter.count).toBe(1)
      expect(result.current.orders).toHaveLength(1)
    })

    it("a tab change fires exactly one additional GET and resets to page 0", async () => {
      const counter = serveOrdersWithGetCount()
      const { result, rerender } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(counter.count).toBe(1)

      setSearchParams("selectedTab=Delivered")
      rerender()

      await waitFor(() => expect(counter.count).toBe(2))
      expect(result.current.currentPage).toBe(0)
    })

    it("a page change fires exactly one additional GET", async () => {
      const counter = serveOrdersWithGetCount()
      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(counter.count).toBe(1)

      act(() => {
        result.current.handlePageChange(2)
      })

      await waitFor(() => expect(counter.count).toBe(2))
    })

    it("a sort change fires exactly one additional GET", async () => {
      const counter = serveOrdersWithGetCount()
      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(counter.count).toBe(1)

      act(() => {
        result.current.handleSort("totalPrice")
      })

      await waitFor(() => expect(counter.count).toBe(2))
      expect(result.current.sortField).toBe("totalPrice")
    })

    it("an orderId change in the URL fires exactly one additional GET, resets to page 0 and passes the id", async () => {
      const orderId = "11111111-1111-1111-1111-111111111111"
      const counter = serveOrdersWithGetCount()
      const { result, rerender } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      act(() => {
        result.current.handlePageChange(3)
      })
      await waitFor(() => expect(counter.count).toBe(2))

      setSearchParams(`orderId=${orderId}`)
      rerender()

      await waitFor(() => expect(counter.count).toBe(3))
      expect(result.current.currentPage).toBe(0)
      expect(result.current.singleOrderId).toBe(orderId)
    })

    it("shows a skeleton (isLoading true), not stale rows, immediately after a param change", async () => {
      server.use(
        http.get("*/backend-api/orders/buyer", async () => {
          await delay(20)
          return HttpResponse.json(makeBuyerOrdersResponse({ orders: [makeBuyerOrder()] }))
        }),
      )
      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.orders).toHaveLength(1)

      act(() => {
        result.current.handlePageChange(1)
      })

      // No `keepPreviousData`: the new params key has never been fetched, so isPending flips
      // back to true and `orders` reads the query's own default ([]), not the previous page's rows.
      expect(result.current.isLoading).toBe(true)
      expect(result.current.orders).toEqual([])

      await waitFor(() => expect(result.current.isLoading).toBe(false))
    })

    // The superseded (page 0) request is slower than the one that replaces it (page 1): if it
    // is not aborted/ignored, its late response would land last and overwrite page 1's rows with
    // page 0's. `gcTime: 0` drops the page-0 cache entry as soon as page 1 becomes current, so
    // even if the network request itself completes, React Query never applies it.
    it("never lets a slower superseded request's response overwrite the current page's rows", async () => {
      const pageZeroOrder = makeBuyerOrder({ orderId: "order-page-0" })
      const pageOneOrder = makeBuyerOrder({ orderId: "order-page-1" })
      server.use(
        http.get("*/backend-api/orders/buyer", async ({ request }) => {
          const page = new URL(request.url).searchParams.get("page")
          if (page === "0") {
            await delay(60)
            return HttpResponse.json(makeBuyerOrdersResponse({ orders: [pageZeroOrder] }))
          }
          return HttpResponse.json(makeBuyerOrdersResponse({ orders: [pageOneOrder] }))
        }),
      )

      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })
      // Switch to page 1 before the initial page-0 fetch (60ms) has resolved.
      act(() => {
        result.current.handlePageChange(1)
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.orders).toEqual([pageOneOrder])

      // Give the superseded page-0 response's own timer a chance to land, in case it was not
      // actually cancelled - the assertion above already proved it never becomes current.
      await new Promise((resolve) => setTimeout(resolve, 80))
      expect(result.current.orders).toEqual([pageOneOrder])
    })

    it("survives a malformed 200 body (orders missing/non-array) without crashing", async () => {
      server.use(http.get("*/backend-api/orders/buyer", () => HttpResponse.json({})))

      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.orders).toEqual([])
      expect(result.current.totalPages).toBe(0)
      expect(result.current.totalElements).toBe(0)
    })

    it("toasts 'Orders unavailable' once on a load failure", async () => {
      server.use(http.get("*/backend-api/orders/buyer", () => HttpResponse.json({ message: "boom" }, { status: 500 })))

      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockToastError).toHaveBeenCalledWith(
        "Orders unavailable",
        "Your orders could not be loaded right now. Please try again.",
      )
    })

    // A real 401 drives the axios interceptor's session teardown (it flags the error
    // `authHandled` before this hook ever sees it) - that teardown is the only reaction, never
    // this page's generic "Orders unavailable" toast. Mirrors useCartPage.test.ts's equivalent.
    it("does not toast when the fetch fails with an auth-handled 401", async () => {
      server.use(
        http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })),
        http.get("*/backend-api/orders/buyer", () => new HttpResponse(null, { status: 401 })),
      )

      const { result } = renderHook(() => useBuyerOrdersQuery(), { wrapper: createQueryWrapper().wrapper })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockToastError).not.toHaveBeenCalled()
    })
  })
})
