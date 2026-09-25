import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { productsAPI } from "@/lib/api/products"
import { server } from "@/mocks/server"
import { makeProduct } from "@/test/factories"
import { useProductSearch } from "./useProductSearch"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const page = (ids: string[], opts: { number?: number; last?: boolean } = {}) => ({
  content: ids.map((id) => ({ id, name: `Product ${id}`, brand: "MARK3", coverPhotoPath: null })),
  totalElements: ids.length,
  totalPages: 2,
  number: opts.number ?? 0,
  size: 10,
  last: opts.last ?? true,
})

interface SearchRequest {
  search: string | null
  brand: string | null
  page: string | null
  signal: AbortSignal
}

const recordSearches = (respond: (req: SearchRequest) => ReturnType<typeof page> = () => page(["p-1"])) => {
  const requests: SearchRequest[] = []
  server.use(
    http.get("*/api/products/active", ({ request }) => {
      const params = new URL(request.url).searchParams
      const req = {
        search: params.get("search"),
        brand: params.get("brand"),
        page: params.get("page"),
        signal: request.signal,
      }
      requests.push(req)
      return HttpResponse.json(respond(req))
    }),
  )
  return requests
}

const WAIT = { timeout: 3000 }

interface ControlledSearch {
  params: Parameters<typeof productsAPI.searchActiveProducts>[0]
  signal: AbortSignal | undefined
  resolve: (body: ReturnType<typeof page>) => void
}

/** Replaces the fetcher with calls the test resolves itself; an abort rejects, like axios. */
const controlSearches = () => {
  const calls: ControlledSearch[] = []
  vi.spyOn(productsAPI, "searchActiveProducts").mockImplementation(
    (params, _token, signal) =>
      new Promise((resolve, reject) => {
        signal?.addEventListener("abort", () => reject(new Error("canceled")))
        calls.push({ params, signal, resolve: (body) => resolve(body as never) })
      }),
  )
  return calls
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) spy.mockClear()
})

describe("useProductSearch", () => {
  it("sends one request for the settled query and opens the dropdown with the results", async () => {
    const requests = recordSearches()
    const { result } = renderHook(() => useProductSearch("vendor-token"))

    act(() => result.current.setSearchQuery("comp"))
    act(() => result.current.setSearchQuery("composite"))

    await waitFor(() => expect(result.current.showDropdown).toBe(true), WAIT)
    expect(requests.map((r) => [r.search, r.page])).toEqual([["composite", "0"]])
    expect(result.current.results.map((r) => r.id)).toEqual(["p-1"])
    expect(result.current.isSearching).toBe(false)
  })

  it("does not search without a token", async () => {
    const requests = recordSearches()
    const { result } = renderHook(() => useProductSearch(null))

    act(() => result.current.setSearchQuery("composite"))
    await new Promise((resolve) => setTimeout(resolve, 700))

    expect(requests).toHaveLength(0)
    expect(result.current.showDropdown).toBe(false)
  })

  it("re-searches page 0 when the brand filter changes, aborting the request still in flight", async () => {
    const calls = controlSearches()
    const { result } = renderHook(() => useProductSearch("vendor-token"))

    act(() => result.current.setSearchQuery("composite"))
    await waitFor(() => expect(calls).toHaveLength(1), WAIT)
    act(() => result.current.setSelectedBrand("Acme"))
    await waitFor(() => expect(calls).toHaveLength(2), WAIT)

    expect(calls[0]?.signal?.aborted).toBe(true)
    expect(calls[1]?.params).toEqual({ search: "composite", brand: "Acme", page: 0, size: 10 })
    await act(async () => calls[1]?.resolve(page(["fresh"])))

    expect(result.current.results.map((r) => r.id)).toEqual(["fresh"])
    expect(result.current.isSearching).toBe(false)
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("appends the next page on a scroll near the bottom and stops once the last page arrived", async () => {
    const requests = recordSearches((req) =>
      req.page === "0" ? page(["p-0"], { number: 0, last: false }) : page(["p-1"], { number: 1, last: true }),
    )
    const { result } = renderHook(() => useProductSearch("vendor-token"))
    const list = document.createElement("div")
    Object.defineProperty(list, "scrollHeight", { value: 1000 })
    Object.defineProperty(list, "clientHeight", { value: 400 })
    Object.defineProperty(list, "scrollTop", { value: 590 })
    result.current.resultsListRef.current = list

    act(() => result.current.setSearchQuery("composite"))
    await waitFor(() => expect(result.current.hasMore).toBe(true), WAIT)

    act(() => result.current.handleResultsScroll())
    await waitFor(() => expect(result.current.results.map((r) => r.id)).toEqual(["p-0", "p-1"]), WAIT)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.isLoadingMore).toBe(false)

    act(() => result.current.handleResultsScroll())
    expect(requests.map((r) => r.page)).toEqual(["0", "1"])
  })

  it("toasts a failed search and clears the results", async () => {
    server.use(http.get("*/api/products/active", () => new HttpResponse(null, { status: 500 })))
    const { result } = renderHook(() => useProductSearch("vendor-token"))

    act(() => result.current.setSearchQuery("composite"))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith(expect.stringContaining("Search error")), WAIT)
    expect(result.current.results).toEqual([])
    expect(result.current.isSearching).toBe(false)
  })

  it("closes the dropdown on a click outside both the input and the dropdown", async () => {
    recordSearches()
    const { result } = renderHook(() => useProductSearch("vendor-token"))
    result.current.searchInputRef.current = document.createElement("input")
    result.current.dropdownRef.current = document.createElement("div")

    act(() => result.current.setSearchQuery("composite"))
    await waitFor(() => expect(result.current.showDropdown).toBe(true), WAIT)

    act(() => {
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    })
    expect(result.current.showDropdown).toBe(false)

    act(() => result.current.reopenDropdown())
    expect(result.current.showDropdown).toBe(true)
  })

  it("clearQuery empties the query and results but keeps the brand filter", async () => {
    recordSearches()
    const { result } = renderHook(() => useProductSearch("vendor-token"))
    act(() => {
      result.current.setSelectedBrand("Acme")
      result.current.setSearchQuery("composite")
    })
    await waitFor(() => expect(result.current.results).toHaveLength(1), WAIT)

    act(() => result.current.clearQuery())

    expect(result.current).toMatchObject({ searchQuery: "", results: [], showDropdown: false, hasMore: false })
    expect(result.current.selectedBrand).toBe("Acme")
  })

  it("reset aborts the search in flight and empties query, brand, results and paging", async () => {
    const calls = controlSearches()
    const { result } = renderHook(() => useProductSearch("vendor-token"))
    act(() => {
      result.current.setSelectedBrand("Acme")
      result.current.setSearchQuery("composite")
    })
    await waitFor(() => expect(calls).toHaveLength(1), WAIT)
    await act(async () => calls[0]?.resolve(page(["p-0"], { last: false })))
    expect(result.current.hasMore).toBe(true)
    act(() => result.current.setSearchQuery("composite kit"))
    await waitFor(() => expect(calls).toHaveLength(2), WAIT)

    act(() => result.current.reset())

    expect(calls[1]?.signal?.aborted).toBe(true)
    expect(result.current).toMatchObject({
      searchQuery: "",
      selectedBrand: null,
      results: [],
      hasMore: false,
      showDropdown: false,
    })
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("loads the full product for the details modal, one lookup at a time", async () => {
    let detailRequests = 0
    server.use(
      http.get("*/api/products/:id", ({ params }) => {
        detailRequests += 1
        return HttpResponse.json(makeProduct({ id: String(params.id), name: "Composite Kit" }))
      }),
    )
    const { result } = renderHook(() => useProductSearch("vendor-token"))
    const item = {
      id: "p-1",
      barcode: "",
      title: "x",
      images: [],
      source: "local" as const,
      originalData: makeProduct(),
    }

    await act(async () => {
      const first = result.current.selectResult(item)
      await first
    })

    expect(detailRequests).toBe(1)
    expect(result.current.modalProduct?.title).toBe("Composite Kit")
    expect(result.current.loadingDetailId).toBeNull()

    act(() => result.current.closeModal())
    expect(result.current.modalProduct).toBeNull()
  })

  it("toasts a failed detail lookup instead of opening the modal", async () => {
    server.use(http.get("*/api/products/:id", () => new HttpResponse(null, { status: 500 })))
    const { result } = renderHook(() => useProductSearch("vendor-token"))

    await act(() =>
      result.current.selectResult({
        id: "p-1",
        barcode: "",
        title: "x",
        images: [],
        source: "local",
        originalData: makeProduct(),
      }),
    )

    expect(toastSpies.error).toHaveBeenCalled()
    expect(result.current.modalProduct).toBeNull()
  })
})
