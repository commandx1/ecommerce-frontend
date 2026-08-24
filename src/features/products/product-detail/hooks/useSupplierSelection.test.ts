import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { getRouterMock, setPathname, setSearchParams } from "@/test/mocks/next-navigation"
import type { SupplierViewModel } from "../types"
import { useSupplierSelection } from "./useSupplierSelection"

const makeSupplier = (overrides: Partial<SupplierViewModel> = {}): SupplierViewModel => ({
  id: 1,
  userProductId: "up-1",
  name: "Acme Dental",
  alt: "Acme Dental logo",
  badge: "Best price",
  price: "$120.50",
  originalPrice: null,
  discount: 0,
  stock: "In stock",
  stockColor: "green",
  stockCount: 10,
  shipping: "Free shipping",
  shippingNote: "",
  shippingFee: "$0.00",
  heavyShippingFee: "$0.00",
  rating: 4.5,
  reviewCount: 12,
  ...overrides,
})

describe("useSupplierSelection", () => {
  beforeEach(() => {
    setPathname("/products/dental-kit")
    setSearchParams("")
  })

  it("returns null selection with zero price when there are no suppliers", () => {
    const { result } = renderHook(() => useSupplierSelection([]))

    expect(result.current.selectedSupplier).toBeNull()
    expect(result.current.selectedPrice).toBe(0)
  })

  it("selects the supplier matching bestPriceVendorUserProductId when no URL vendorId is present", () => {
    const suppliers = [makeSupplier({ id: 1, userProductId: "up-1" }), makeSupplier({ id: 2, userProductId: "up-2" })]

    const { result } = renderHook(() => useSupplierSelection(suppliers, "up-2"))

    expect(result.current.selectedSupplier?.userProductId).toBe("up-2")
  })

  it("falls back to the first supplier when bestPriceVendorUserProductId does not match anything", () => {
    const suppliers = [makeSupplier({ id: 1, userProductId: "up-1" }), makeSupplier({ id: 2, userProductId: "up-2" })]

    const { result } = renderHook(() => useSupplierSelection(suppliers, "not-a-real-id"))

    expect(result.current.selectedSupplier?.userProductId).toBe("up-1")
  })

  it("prefers the supplier identified by the vendorId URL param over the best-price default", () => {
    setSearchParams("vendorId=up-2")
    const suppliers = [makeSupplier({ id: 1, userProductId: "up-1" }), makeSupplier({ id: 2, userProductId: "up-2" })]

    const { result } = renderHook(() => useSupplierSelection(suppliers, "up-1"))

    expect(result.current.selectedSupplier?.userProductId).toBe("up-2")
  })

  it("falls back to best price when the URL vendorId does not match any in-stock supplier", () => {
    setSearchParams("vendorId=does-not-exist")
    const suppliers = [makeSupplier({ id: 1, userProductId: "up-1" }), makeSupplier({ id: 2, userProductId: "up-2" })]

    const { result } = renderHook(() => useSupplierSelection(suppliers, "up-2"))

    expect(result.current.selectedSupplier?.userProductId).toBe("up-2")
  })

  it("parses the selected supplier's formatted price string into a number", () => {
    const suppliers = [makeSupplier({ userProductId: "up-1", price: "$1,234.56" })]

    const { result } = renderHook(() => useSupplierSelection(suppliers))

    expect(result.current.selectedPrice).toBeCloseTo(1234.56)
  })

  it("setSelectedSupplier replaces the URL with the chosen supplier's vendorId", () => {
    const suppliers = [makeSupplier({ userProductId: "up-1" }), makeSupplier({ id: 2, userProductId: "up-2" })]

    const { result } = renderHook(() => useSupplierSelection(suppliers))

    result.current.setSelectedSupplier(suppliers[1])

    const router = getRouterMock()
    expect(router.replace).toHaveBeenCalledWith("/products/dental-kit?vendorId=up-2", { scroll: false })
  })

  it("setSelectedSupplier is a no-op when re-selecting the supplier already reflected in the URL", () => {
    setSearchParams("vendorId=up-1")
    const suppliers = [makeSupplier({ userProductId: "up-1" })]

    const { result } = renderHook(() => useSupplierSelection(suppliers))

    result.current.setSelectedSupplier(suppliers[0])

    expect(getRouterMock().replace).not.toHaveBeenCalled()
  })

  it("setSelectedSupplier is a no-op for a supplier without a userProductId", () => {
    const suppliers = [makeSupplier({ userProductId: undefined })]

    const { result } = renderHook(() => useSupplierSelection(suppliers))

    result.current.setSelectedSupplier(suppliers[0])

    expect(getRouterMock().replace).not.toHaveBeenCalled()
  })

  it("syncs the resolved default selection into the URL via an effect when no vendorId is present yet", () => {
    const suppliers = [makeSupplier({ userProductId: "up-1" })]

    renderHook(() => useSupplierSelection(suppliers))

    const router = getRouterMock()
    expect(router.replace).toHaveBeenCalledWith("/products/dental-kit?vendorId=up-1", { scroll: false })
  })
})
