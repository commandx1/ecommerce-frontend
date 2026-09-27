import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NormalizedSearchProduct } from "@/lib/api/products"
import { productsAPI } from "@/lib/api/products"
import { queryKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useProductDetailsSubmit } from "./useProductDetailsSubmit"

const revalidateCategoryCountsSpy = vi.hoisted(() => vi.fn())
vi.mock("@/lib/actions/revalidate-category-counts", () => ({
  revalidateCategoryCounts: revalidateCategoryCountsSpy,
}))

const localCatalogProduct = (): NormalizedSearchProduct => {
  const product = makeProduct()
  return {
    id: product.id,
    barcode: String(product.barcode),
    title: product.name,
    brand: product.brand,
    category: undefined,
    images: product.coverPhotoPath ? [product.coverPhotoPath] : [],
    source: "local",
    originalData: product,
  }
}

const onSuccess = vi.fn()

const setup = () => {
  const { wrapper, client } = createQueryWrapper()
  return {
    ...renderHook(() => useProductDetailsSubmit({ product: localCatalogProduct(), isOpen: true, onSuccess }), {
      wrapper,
    }),
    client,
  }
}

beforeEach(() => {
  revalidateCategoryCountsSpy.mockClear().mockResolvedValue(undefined)
  onSuccess.mockClear()
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("useProductDetailsSubmit", () => {
  /**
   * F6 regression guard: adding a catalogued product from search used to invalidate neither the
   * vendor's product list nor its stat cards/brand filter, so VendorProductsPage kept showing
   * stale data behind the modal after "Add Product".
   */
  it("invalidates the vendor products list, stats and brands after adding a catalogued product", async () => {
    vi.spyOn(productsAPI, "createUserProduct").mockResolvedValue({
      userProductId: "up-1",
    } as never)
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    act(() => result.current.setPrice("19.99"))
    act(() => result.current.setStock("10"))

    await act(() => result.current.handleSubmit())

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual(queryKeys.vendor.products.all)
  })

  it("does not invalidate the vendor products list when the add request fails", async () => {
    vi.spyOn(productsAPI, "createUserProduct").mockRejectedValue(new Error("Failed to create user product"))
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    act(() => result.current.setPrice("19.99"))
    act(() => result.current.setStock("10"))

    await act(() => result.current.handleSubmit())

    await waitFor(() => expect(result.current.errorMessage).not.toBeNull())
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).not.toContainEqual(
      queryKeys.vendor.products.all,
    )
  })
})
