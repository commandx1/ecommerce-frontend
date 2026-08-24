import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { getRouterMock, setSearchParams } from "@/test/mocks/next-navigation"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"
import FilterNavigationProvider from "./FilterNavigationProvider"

function renderNavigation() {
  return renderHook(() => useProductFiltersNavigation(), { wrapper: FilterNavigationProvider })
}

describe("FilterNavigationProvider", () => {
  beforeEach(() => {
    setSearchParams("")
  })

  it("throws a descriptive error when the navigation hook is used outside the provider", () => {
    expect(() => renderHook(() => useProductFiltersNavigation())).toThrow(
      "useProductFiltersNavigation must be used within FilterNavigationProvider",
    )
  })

  it("exposes the current filter state derived from the URL search params", () => {
    setSearchParams("brands=nike&brands=puma&categories=shoes&minPrice=10&maxPrice=50&minRating=4&inStock=false")

    const { result } = renderNavigation()

    expect(result.current.currentBrands).toEqual(["nike", "puma"])
    expect(result.current.currentCategories).toEqual(["shoes"])
    expect(result.current.currentMinPrice).toBe(10)
    expect(result.current.currentMaxPrice).toBe(50)
    expect(result.current.currentMinRating).toBe(4)
    expect(result.current.currentInStock).toBe(false)
  })

  it("defaults currentInStock to true when the param is absent", () => {
    const { result } = renderNavigation()
    expect(result.current.currentInStock).toBe(true)
  })

  it("navigate() pushes to /products with page reset to 1 and preserves size/view/sort", () => {
    setSearchParams("size=24&view=grid&sort=price_asc&page=3")

    const { result } = renderNavigation()

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
    expect(params.get("view")).toBe("grid")
    expect(params.get("sort")).toBe("price_asc")
    expect(params.getAll("brands")).toEqual(["nike"])
  })

  it("navigate() carries forward params not present in the update", () => {
    setSearchParams("categories=shoes&vendors=acme")

    const { result } = renderNavigation()

    act(() => {
      result.current.navigate({ brands: ["nike"] })
    })

    const router = getRouterMock()
    const [url] = router.push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])

    expect(params.getAll("categories")).toEqual(["shoes"])
    expect(params.getAll("vendors")).toEqual(["acme"])
    expect(params.getAll("brands")).toEqual(["nike"])
  })

  it("navigate() clears a previously-set filter when the update explicitly provides an empty/null value", () => {
    setSearchParams("brands=nike&minPrice=10&companyId=abc")

    const { result } = renderNavigation()

    act(() => {
      result.current.navigate({ brands: [], minPrice: null, companyId: null })
    })

    const router = getRouterMock()
    const [url] = router.push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])

    expect(params.getAll("brands")).toEqual([])
    expect(params.has("minPrice")).toBe(false)
    expect(params.has("companyId")).toBe(false)
  })

  it("navigate() sets inStock=false explicitly but omits it when true (the implicit default)", () => {
    setSearchParams("")
    const { result } = renderNavigation()

    act(() => {
      result.current.navigate({ inStock: false })
    })
    let router = getRouterMock()
    let [url] = router.push.mock.calls[0] as [string]
    let params = new URLSearchParams(url.split("?")[1])
    expect(params.get("inStock")).toBe("false")

    act(() => {
      result.current.navigate({ inStock: true })
    })
    router = getRouterMock()
    ;[url] = router.push.mock.calls[1] as [string]
    params = new URLSearchParams(url.split("?")[1])
    expect(params.has("inStock")).toBe(false)
  })

  it("startNavigation exposes the underlying transition starter", () => {
    const { result } = renderNavigation()
    expect(typeof result.current.startNavigation).toBe("function")

    act(() => {
      result.current.startNavigation(() => {})
    })
    // isPending settles back to false once the transition callback completes synchronously.
    expect(result.current.isPending).toBe(false)
  })
})
