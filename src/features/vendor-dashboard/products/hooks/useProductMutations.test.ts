import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
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
  const { wrapper } = createQueryWrapper()
  return renderHook(() => useProductMutations(LIST_PARAMS, "vendor-token"), { wrapper })
}

beforeEach(() => {
  for (const spy of Object.values(toastSpies)) spy.mockClear()
  revalidateCategoryCountsSpy.mockClear()
})

describe("useProductMutations", () => {
  it("saveEdit triggers category-counts revalidation on success (stock/active feed public counts)", async () => {
    server.use(http.put("*/api/user-products/:id", () => HttpResponse.json(makeVendorUserProduct())))
    const { result } = setup()

    act(() => result.current.startEdit(PRODUCT))
    await act(() => result.current.saveEdit(PRODUCT))

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
})
