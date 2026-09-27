import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { makeVendorUserProduct } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import type { ProductWithDetails } from "../types"
import { useProductMutations } from "./useProductMutations"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const revalidateCategoryCountsSpy = vi.hoisted(() => vi.fn())
vi.mock("@/lib/actions/revalidate-category-counts", () => ({
  revalidateCategoryCounts: revalidateCategoryCountsSpy,
}))

const LIST_PARAMS = {
  view: "active" as const,
  type: "TOTAL" as const,
  page: 0,
  size: 10,
  sortBy: null,
  sortDir: null,
  search: "",
  howManySoldDay: null,
  userProductId: null,
  brand: null,
}

const PRODUCT = makeVendorUserProduct() as ProductWithDetails

const setup = () => {
  const { wrapper, client } = createQueryWrapper()
  return { ...renderHook(() => useProductMutations(LIST_PARAMS, "vendor-token"), { wrapper }), client }
}

beforeEach(() => {
  for (const spy of Object.values(toastSpies)) spy.mockClear()
  revalidateCategoryCountsSpy.mockClear()
})

describe("useProductMutations", () => {
  /**
   * `saveEdit`'s category-counts purge is narrowed to only the edits that can move a listing in
   * or out of its category's public count: stock crossing the 0 boundary, or the active toggle.
   * A price/discount/shipping-only edit must not fire it - see the F6-style regression comment
   * inline in `useProductMutations.ts`.
   */
  it("does not revalidate category counts for a price-only edit", async () => {
    const product = makeVendorUserProduct({ stock: 5, active: true }) as ProductWithDetails
    server.use(http.put("*/api/user-products/:id", () => HttpResponse.json(makeVendorUserProduct())))
    const { result } = setup()

    act(() => result.current.startEdit(product))
    act(() => result.current.updateDraft({ price: "999" }))
    await act(() => result.current.saveEdit(product))

    // Sanity: the save actually succeeded (editingProductId clears) rather than failing silently
    // before ever reaching the revalidation decision.
    await waitFor(() => expect(result.current.editingProductId).toBeNull())
    expect(toastSpies.error).not.toHaveBeenCalled()
    expect(revalidateCategoryCountsSpy).not.toHaveBeenCalled()
  })

  it("revalidates category counts when stock crosses from in-stock to out-of-stock (5 -> 0)", async () => {
    const product = makeVendorUserProduct({ stock: 5, active: true }) as ProductWithDetails
    server.use(http.put("*/api/user-products/:id", () => HttpResponse.json(makeVendorUserProduct())))
    const { result } = setup()

    act(() => result.current.startEdit(product))
    act(() => result.current.updateDraft({ stock: "0" }))
    await act(() => result.current.saveEdit(product))

    await waitFor(() => expect(revalidateCategoryCountsSpy).toHaveBeenCalledTimes(1))
  })

  it("revalidates category counts when stock crosses from out-of-stock to in-stock (0 -> 3)", async () => {
    const product = makeVendorUserProduct({ stock: 0, active: true }) as ProductWithDetails
    server.use(http.put("*/api/user-products/:id", () => HttpResponse.json(makeVendorUserProduct())))
    const { result } = setup()

    act(() => result.current.startEdit(product))
    act(() => result.current.updateDraft({ stock: "3" }))
    await act(() => result.current.saveEdit(product))

    await waitFor(() => expect(revalidateCategoryCountsSpy).toHaveBeenCalledTimes(1))
  })

  it("does not revalidate category counts when stock changes but stays above zero (5 -> 3)", async () => {
    const product = makeVendorUserProduct({ stock: 5, active: true }) as ProductWithDetails
    server.use(http.put("*/api/user-products/:id", () => HttpResponse.json(makeVendorUserProduct())))
    const { result } = setup()

    act(() => result.current.startEdit(product))
    act(() => result.current.updateDraft({ stock: "3" }))
    await act(() => result.current.saveEdit(product))

    await waitFor(() => expect(result.current.editingProductId).toBeNull())
    expect(toastSpies.error).not.toHaveBeenCalled()
    expect(revalidateCategoryCountsSpy).not.toHaveBeenCalled()
  })

  it("revalidates category counts when the active toggle changes", async () => {
    const product = makeVendorUserProduct({ stock: 5, active: true }) as ProductWithDetails
    server.use(http.put("*/api/user-products/:id", () => HttpResponse.json(makeVendorUserProduct())))
    const { result } = setup()

    act(() => result.current.startEdit(product))
    act(() => result.current.updateDraft({ active: "inactive" }))
    await act(() => result.current.saveEdit(product))

    await waitFor(() => expect(revalidateCategoryCountsSpy).toHaveBeenCalledTimes(1))
  })

  it("saveEdit does not revalidate category counts when the request fails", async () => {
    server.use(http.put("*/api/user-products/:id", () => new HttpResponse(null, { status: 500 })))
    const { result } = setup()

    act(() => result.current.startEdit(PRODUCT))
    await act(() => result.current.saveEdit(PRODUCT))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledTimes(1))
    expect(revalidateCategoryCountsSpy).not.toHaveBeenCalled()
  })

  it("deleteProduct triggers category-counts revalidation on success", async () => {
    server.use(http.delete("*/api/user-products/:id", () => new HttpResponse(null, { status: 204 })))
    const { result } = setup()

    const deleted = await act(() => result.current.deleteProduct(PRODUCT.id))

    expect(deleted).toBe(true)
    await waitFor(() => expect(revalidateCategoryCountsSpy).toHaveBeenCalledTimes(1))
  })

  it("deleteProduct does not revalidate category counts when the request fails", async () => {
    server.use(http.delete("*/api/user-products/:id", () => new HttpResponse(null, { status: 500 })))
    const { result } = setup()

    const deleted = await act(() => result.current.deleteProduct(PRODUCT.id))

    expect(deleted).toBe(false)
    expect(revalidateCategoryCountsSpy).not.toHaveBeenCalled()
  })

  /**
   * F6 regression guard: a deleted product used to only invalidate the products list and stat
   * cards, so a brand that only appeared on the deleted listing lingered in the brand filter.
   */
  it("invalidates the vendor products brand filter (and stats) after a delete", async () => {
    server.use(http.delete("*/api/user-products/:id", () => new HttpResponse(null, { status: 204 })))
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const deleted = await act(() => result.current.deleteProduct(PRODUCT.id))

    expect(deleted).toBe(true)
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual(queryKeys.vendor.products.all)
  })
})
