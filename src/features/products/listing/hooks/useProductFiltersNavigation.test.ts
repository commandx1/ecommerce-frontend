import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { getRouterMock, setSearchParams } from "@/test/mocks/next-navigation"
import { useFilterNavigationProvider, useProductFiltersNavigation } from "./useProductFiltersNavigation"

describe("useProductFiltersNavigation", () => {
  beforeEach(() => {
    setSearchParams("")
  })

  it("throws when used outside of FilterNavigationContext.Provider", () => {
    expect(() => renderHook(() => useProductFiltersNavigation())).toThrow(
      "useProductFiltersNavigation must be used within FilterNavigationProvider",
    )
  })
})

describe("useFilterNavigationProvider", () => {
  beforeEach(() => {
    setSearchParams("")
  })

  it("navigate() pushes to /products with the page reset to 1", () => {
    setSearchParams("page=5&size=24")
    const { result } = renderHook(() => useFilterNavigationProvider())

    act(() => {
      result.current.navigate({ brands: ["nike"] })
    })

    const router = getRouterMock()
    expect(router.push).toHaveBeenCalledTimes(1)
    const [url, options] = router.push.mock.calls[0] as [string, { scroll: boolean }]
    expect(options).toEqual({ scroll: false })

    const params = new URLSearchParams(url.split("?")[1])
    expect(url.startsWith("/products?")).toBe(true)
    expect(params.get("page")).toBe("1")
    expect(params.get("size")).toBe("24")
    expect(params.getAll("brands")).toEqual(["nike"])
  })

  it("navigate() only overrides the filters passed in the update, keeping the rest from the URL", () => {
    setSearchParams("categories=shoes&vendors=acme&minRating=3")
    const { result } = renderHook(() => useFilterNavigationProvider())

    act(() => {
      result.current.navigate({ brands: ["nike"] })
    })

    const [url] = getRouterMock().push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])

    expect(params.getAll("categories")).toEqual(["shoes"])
    expect(params.getAll("vendors")).toEqual(["acme"])
    expect(params.get("minRating")).toBe("3")
    expect(params.getAll("brands")).toEqual(["nike"])
  })

  it("navigate() clears a filter when the update explicitly sets it to null/empty", () => {
    setSearchParams("brands=nike&minPrice=10&companyId=abc")
    const { result } = renderHook(() => useFilterNavigationProvider())

    act(() => {
      result.current.navigate({ brands: [], minPrice: null, companyId: null })
    })

    const [url] = getRouterMock().push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])

    expect(params.getAll("brands")).toEqual([])
    expect(params.has("minPrice")).toBe(false)
    expect(params.has("companyId")).toBe(false)
  })

  it("exposes the current filter state parsed straight from the URL search params", () => {
    setSearchParams("brands=nike&brands=puma&minPrice=10&maxPrice=50&minRating=4&inStock=false&attributes=color")
    const { result } = renderHook(() => useFilterNavigationProvider())

    expect(result.current.currentBrands).toEqual(["nike", "puma"])
    expect(result.current.currentMinPrice).toBe(10)
    expect(result.current.currentMaxPrice).toBe(50)
    expect(result.current.currentMinRating).toBe(4)
    expect(result.current.currentInStock).toBe(false)
    expect(result.current.currentAttributes).toEqual(["color"])
  })

  it("defaults currentInStock to true when the param is absent", () => {
    const { result } = renderHook(() => useFilterNavigationProvider())
    expect(result.current.currentInStock).toBe(true)
  })

  it("startNavigation exposes the raw startTransition escape hatch", () => {
    const { result } = renderHook(() => useFilterNavigationProvider())
    expect(typeof result.current.startNavigation).toBe("function")

    let ran = false
    act(() => {
      result.current.startNavigation(() => {
        ran = true
      })
    })
    expect(ran).toBe(true)
  })

  it("isPending reflects the transition state while a navigation is in flight and settles back to false", () => {
    const { result } = renderHook(() => useFilterNavigationProvider())
    expect(result.current.isPending).toBe(false)

    act(() => {
      result.current.navigate({ brands: ["nike"] })
    })

    // React flushes the transition synchronously in the test environment, so by the time
    // `act` resolves the pending state has already settled back to false.
    expect(result.current.isPending).toBe(false)
    expect(getRouterMock().push).toHaveBeenCalledTimes(1)
  })
})
