import { renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeProduct, makeUserProductDetailResponse, makeVendorUserProduct } from "@/test/factories"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { useProductEditorLoad } from "./useProductEditorLoad"
import type { ProductEditorModeInfo } from "./useProductEditorMode"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const CREATE: ProductEditorModeInfo = {
  mode: "create",
  isEditMode: false,
  userProductId: null,
  isReviewEditMode: false,
  reviewProductId: null,
  reviewUserProductId: null,
}
const EDIT: ProductEditorModeInfo = { ...CREATE, mode: "edit", isEditMode: true, userProductId: "up-9" }
const REVIEW_EDIT: ProductEditorModeInfo = {
  ...CREATE,
  mode: "reviewEdit",
  isReviewEditMode: true,
  reviewProductId: "p-1",
  reviewUserProductId: "up-9",
}

beforeEach(() => {
  for (const spy of Object.values(toastSpies)) spy.mockClear()
})

describe("useProductEditorLoad", () => {
  it("loads nothing in create mode", async () => {
    const requests = vi.fn()
    server.events.on("request:start", requests)
    const onLoaded = vi.fn()

    const { result } = renderHook(() => useProductEditorLoad(CREATE, "vendor-token", onLoaded))
    await new Promise((resolve) => setTimeout(resolve, 20))

    server.events.removeListener("request:start", requests)
    expect(requests).not.toHaveBeenCalled()
    expect(onLoaded).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it("plain edit: one list request, one product request, then seeds with the catalogue fields locked", async () => {
    const counts = { list: 0, product: 0 }
    server.use(
      http.get("*/api/user-products", () => {
        counts.list += 1
        return HttpResponse.json([makeVendorUserProduct({ id: "up-9", productId: "p-7", price: 56, discount: 20 })])
      }),
      http.get("*/api/products/:id", ({ params }) => {
        counts.product += 1
        return HttpResponse.json(makeProduct({ id: String(params.id), name: "Existing" }))
      }),
    )
    const onLoaded = vi.fn()

    const { result } = renderHook(() => useProductEditorLoad(EDIT, "vendor-token", onLoaded))

    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1))
    expect(onLoaded.mock.calls[0]?.[0]).toMatchObject({
      values: { name: "Existing", price: "56" },
      editDiscount: "20",
      lockCatalogueFields: true,
    })
    expect(counts).toEqual({ list: 1, product: 1 })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it("plain edit: a listing that is not the vendor's toasts 'Product not found' and returns to the list", async () => {
    server.use(http.get("*/api/user-products", () => HttpResponse.json([])))
    const onLoaded = vi.fn()

    renderHook(() => useProductEditorLoad(EDIT, "vendor-token", onLoaded))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Product not found"))
    expect(getRouterMock().push).toHaveBeenCalledWith("/vendor-dashboard/products")
    expect(onLoaded).not.toHaveBeenCalled()
  })

  it.each([
    ["plain edit", EDIT, http.get("*/api/products/:id", () => new HttpResponse(null, { status: 500 }))],
    ["review edit", REVIEW_EDIT, http.get("*/api/products/:id/owner", () => new HttpResponse(null, { status: 500 }))],
  ])("%s: a failed load toasts and returns to the list", async (_label, modeInfo, failure) => {
    server.use(failure)
    const onLoaded = vi.fn()

    const { result } = renderHook(() => useProductEditorLoad(modeInfo, "vendor-token", onLoaded))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledTimes(1))
    expect(getRouterMock().push).toHaveBeenCalledWith("/vendor-dashboard/products")
    expect(onLoaded).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it("review edit: fetches the owner product and the listing once each and seeds both", async () => {
    const counts = { product: 0, listing: 0 }
    server.use(
      http.get("*/api/products/:id/owner", () => {
        counts.product += 1
        return HttpResponse.json(
          makeProduct({ id: "p-1", name: "Rejected", coverPhotoPath: undefined, photoPhats: [] }),
        )
      }),
      http.get("*/api/user-products/:id", () => {
        counts.listing += 1
        return HttpResponse.json(makeUserProductDetailResponse({ id: "up-9", skuCode: "SKU-9" }))
      }),
    )
    const onLoaded = vi.fn()

    renderHook(() => useProductEditorLoad(REVIEW_EDIT, "vendor-token", onLoaded))

    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1))
    expect(onLoaded.mock.calls[0]?.[0]).toEqual({
      values: expect.objectContaining({ name: "Rejected", skuCode: "SKU-9" }),
      existingImages: { coverPhoto: null, photos: [] },
    })
    expect(counts).toEqual({ product: 1, listing: 1 })
  })

  it("waits for a token and reloads when it changes", async () => {
    let listRequests = 0
    server.use(
      http.get("*/api/user-products", () => {
        listRequests += 1
        return HttpResponse.json([makeVendorUserProduct({ id: "up-9" })])
      }),
    )
    const onLoaded = vi.fn()

    const { rerender } = renderHook(({ token }) => useProductEditorLoad(EDIT, token, onLoaded), {
      initialProps: { token: null as string | null },
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(listRequests).toBe(0)

    rerender({ token: "token-a" })
    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1))
    rerender({ token: "token-b" })
    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(2))
    expect(listRequests).toBe(2)
  })
})
