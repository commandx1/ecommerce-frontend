import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import type { ChangeEvent } from "react"
import { beforeEach, describe, expect, it } from "vitest"
import type { SearchProduct } from "@/lib/api/product-search"
import { server } from "@/mocks/server"
import { useMainSearch } from "./useMainSearch"

const ENDPOINT = "*/api/products/public-search"

const makeSearchProduct = (overrides: Partial<SearchProduct> = {}): SearchProduct => ({
  productId: "product-1",
  productName: "Intra Oral Mixing Tips",
  barcode: "123456",
  coverPhotoPath: "/uploads/product-1.jpg",
  secureCode: "abc",
  manufacturerCode: "MARK3",
  reorderId: null,
  referanceNumber: null,
  userId: "user-1",
  price: 80,
  oldPrice: 100,
  discount: 20,
  stock: 5,
  ...overrides,
})

const change = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLInputElement>

/** A resolver that counts every request it receives and answers with `products` immediately. */
function countingHandler(products: SearchProduct[], counter: { calls: number }) {
  return http.get(ENDPOINT, () => {
    counter.calls += 1
    return HttpResponse.json({ content: products })
  })
}

describe("useMainSearch", () => {
  beforeEach(() => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ content: [] })))
  })

  it("does not fire a request for an empty query", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 20 }))
    expect(result.current.searchQuery).toBe("")

    // Give the debounce window time to elapse - nothing should have fired.
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(counter.calls).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.showDropdown).toBe(false)
  })

  it("does not fire a request for a whitespace-only query (trimmed to empty)", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 20 }))

    act(() => {
      result.current.handleInputChange(change("   "))
    })

    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(counter.calls).toBe(0)
  })

  // KAYNAKTAN DOĞRULAMA: `useMainSearch` does not enforce a minimum query length beyond
  // `searchQuery.trim()` being non-empty (see the `useEffect` in useMainSearch.ts) - a
  // single character already triggers a debounced request. There is no `minLength`/`minChars`
  // option like some other search boxes in this codebase might imply.
  it("a single non-whitespace character is enough to trigger a search (no min-length gate)", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([makeSearchProduct()], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 20 }))

    act(() => {
      result.current.handleInputChange(change("a"))
    })

    await waitFor(() => expect(counter.calls).toBe(1))
    await waitFor(() => expect(result.current.searchResults).toHaveLength(1))
  })

  it("debounces rapid keystrokes into exactly one network request", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([makeSearchProduct()], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 30 }))

    // Simulate typing "dental" one keystroke at a time, well inside the debounce window.
    for (const partial of ["d", "de", "den", "dent", "denta", "dental"]) {
      act(() => {
        result.current.handleInputChange(change(partial))
      })
    }

    expect(result.current.searchQuery).toBe("dental")
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(counter.calls).toBe(1)
    expect(result.current.searchResults).toHaveLength(1)
  })

  it("shows the dropdown once results arrive, and hides it again once the query is cleared", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([makeSearchProduct()], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    act(() => {
      result.current.handleInputChange(change("dental"))
    })
    await waitFor(() => expect(result.current.showDropdown).toBe(true))

    act(() => {
      result.current.handleInputChange(change(""))
    })
    expect(result.current.showDropdown).toBe(false)
    expect(result.current.searchResults).toEqual([])
  })

  it("does not open the dropdown when the search returns zero results", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    act(() => {
      result.current.handleInputChange(change("nomatch"))
    })

    await waitFor(() => expect(counter.calls).toBe(1))
    expect(result.current.showDropdown).toBe(false)
    expect(result.current.searchResults).toEqual([])
  })

  it("a race between two searches resolves to the LATEST query's results, even if the older request's response arrives last", async () => {
    // Two in-flight requests, each gated behind its own manually-resolved promise so we can
    // control the order in which their responses land regardless of when they were sent.
    const gates = new Map<string, { promise: Promise<SearchProduct[]>; resolve: (v: SearchProduct[]) => void }>()
    const requestOrder: string[] = []

    server.use(
      http.get(ENDPOINT, async ({ request }) => {
        const url = new URL(request.url)
        const query = url.searchParams.get("search") ?? ""
        requestOrder.push(query)

        let gate = gates.get(query)
        if (!gate) {
          let resolve!: (v: SearchProduct[]) => void
          const promise = new Promise<SearchProduct[]>((r) => {
            resolve = r
          })
          gate = { promise, resolve }
          gates.set(query, gate)
        }

        const products = await gate.promise
        return HttpResponse.json({ content: products })
      }),
    )

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    // First search: "old" - let its debounce elapse so the (slow) request is actually sent.
    act(() => {
      result.current.handleInputChange(change("old"))
    })
    await waitFor(() => expect(requestOrder).toContain("old"))

    // Second search arrives before "old" resolves - its debounce also elapses, sending a
    // second (fast) request.
    act(() => {
      result.current.handleInputChange(change("new"))
    })
    await waitFor(() => expect(requestOrder).toContain("new"))

    // The newer request resolves first...
    act(() => {
      gates.get("new")?.resolve([makeSearchProduct({ productId: "new-product", productName: "New result" })])
    })
    await waitFor(() => expect(result.current.searchResults[0]?.productId).toBe("new-product"))

    // ...then the stale, older request finally resolves. It must NOT clobber the newer result.
    act(() => {
      gates.get("old")?.resolve([makeSearchProduct({ productId: "old-product", productName: "Old result" })])
    })

    // Give the stale response's microtasks a chance to run before asserting nothing changed.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    expect(result.current.searchResults).toHaveLength(1)
    expect(result.current.searchResults[0]?.productId).toBe("new-product")
    expect(result.current.searchQuery).toBe("new")
  })

  it("handleResultClick closes the dropdown and clears the query (as when a result is selected/navigated to)", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([makeSearchProduct()], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    act(() => {
      result.current.handleInputChange(change("dental"))
    })
    await waitFor(() => expect(result.current.showDropdown).toBe(true))

    act(() => {
      result.current.handleResultClick()
    })

    expect(result.current.showDropdown).toBe(false)
    expect(result.current.searchQuery).toBe("")
  })

  it("handleInputFocus does nothing when there are no results yet", () => {
    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    act(() => {
      result.current.handleInputFocus()
    })
    expect(result.current.showDropdown).toBe(false)
  })

  it("handleInputFocus reopens the dropdown when results are already loaded but the dropdown was dismissed", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([makeSearchProduct()], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    const dropdownEl = document.createElement("div")
    const inputEl = document.createElement("input")
    const outsideEl = document.createElement("div")
    document.body.append(dropdownEl, inputEl, outsideEl)
    act(() => {
      result.current.dropdownRef.current = dropdownEl
      result.current.inputRef.current = inputEl
    })

    act(() => {
      result.current.handleInputChange(change("dental"))
    })
    await waitFor(() => expect(result.current.showDropdown).toBe(true))

    // Dismiss without clearing the query/results (e.g. clicked outside).
    act(() => {
      outsideEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    })
    expect(result.current.showDropdown).toBe(false)
    expect(result.current.searchResults).toHaveLength(1)

    act(() => {
      result.current.handleInputFocus()
    })
    expect(result.current.showDropdown).toBe(true)

    dropdownEl.remove()
    inputEl.remove()
    outsideEl.remove()
  })

  it("clicking outside both the input and the dropdown closes the dropdown", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([makeSearchProduct()], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    const dropdownEl = document.createElement("div")
    const inputEl = document.createElement("input")
    const outsideEl = document.createElement("div")
    document.body.append(dropdownEl, inputEl, outsideEl)

    act(() => {
      result.current.dropdownRef.current = dropdownEl
      result.current.inputRef.current = inputEl
    })

    act(() => {
      result.current.handleInputChange(change("dental"))
    })
    await waitFor(() => expect(result.current.showDropdown).toBe(true))

    act(() => {
      outsideEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    })

    expect(result.current.showDropdown).toBe(false)

    dropdownEl.remove()
    inputEl.remove()
    outsideEl.remove()
  })

  it("a click inside the dropdown or the input itself does not close the dropdown", async () => {
    const counter = { calls: 0 }
    server.use(countingHandler([makeSearchProduct()], counter))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    const dropdownEl = document.createElement("div")
    const inputEl = document.createElement("input")
    document.body.append(dropdownEl, inputEl)

    act(() => {
      result.current.dropdownRef.current = dropdownEl
      result.current.inputRef.current = inputEl
    })

    act(() => {
      result.current.handleInputChange(change("dental"))
    })
    await waitFor(() => expect(result.current.showDropdown).toBe(true))

    act(() => {
      dropdownEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    })
    expect(result.current.showDropdown).toBe(true)

    dropdownEl.remove()
    inputEl.remove()
  })

  it("a failed search request (5xx) resolves to an empty, closed-dropdown state rather than throwing", async () => {
    // KAYNAKTAN DOĞRULAMA / BULGU: `searchPublicProducts` (src/lib/api/product-search.ts) already
    // swallows every error internally and resolves to `[]`. That means the `catch` block inside
    // `useMainSearch`'s debounce effect is unreachable via a real network failure - by the time an
    // HTTP error reaches the hook it has already been turned into an empty successful result. This
    // test documents the actually-observable behavior (empty results, closed dropdown, no throw)
    // rather than the hook's own dead catch branch. Not a source change - reporting only.
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ message: "Internal error" }, { status: 500 })))

    const { result } = renderHook(() => useMainSearch({ debounceMs: 10 }))

    act(() => {
      result.current.handleInputChange(change("dental"))
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.searchResults).toEqual([])
    expect(result.current.showDropdown).toBe(false)
  })

  it("getImageSrc falls back to the placeholder when there is no cover photo or the image previously failed", () => {
    const { result } = renderHook(() => useMainSearch())
    const withPhoto = makeSearchProduct({ productId: "p1", coverPhotoPath: "/uploads/p1.jpg" })
    const withoutPhoto = makeSearchProduct({ productId: "p2", coverPhotoPath: null })

    expect(result.current.getImageSrc(withoutPhoto)).toBe("/dentypro-product-placeholder.png")
    expect(result.current.getImageSrc(withPhoto)).not.toBe("/dentypro-product-placeholder.png")

    act(() => {
      result.current.handleImageError("p1")
    })

    expect(result.current.getImageSrc(withPhoto)).toBe("/dentypro-product-placeholder.png")
  })
})
