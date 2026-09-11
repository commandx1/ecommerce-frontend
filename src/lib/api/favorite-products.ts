import { apiRequest } from "@/lib/api/request"

export interface FavoriteProductItem {
  productId: string
  productName: string
  brand: string | null
  barcode: string | null
  coverPhotoPath: string | null
  manufacturerCode: string | null
  reorderId: string | null
  referanceNumber: string | null
  overallStar: number | null
  reviewCount: number
  vendorsCount: number
  bestPriceVendor: string | null
  price: number | null
  oldPrice: number | null
  discount: number | null
  stock: number | null
}

export async function getMyFavoriteProductIds(): Promise<string[]> {
  const ids = await apiRequest.requestJson<string[]>({
    client: "backend",
    method: "GET",
    url: "/products/favorite-ids",
    fallbackMessage: "Failed to fetch favorite product IDs",
  })
  // The endpoint is typed `List<String>`, but a malformed 200 is not an array and callers use
  // `.has()` on it to decide the starred state (mirrors vendors.ts infra note #26).
  return Array.isArray(ids) ? ids : []
}

export async function getMyFavoriteProducts(): Promise<FavoriteProductItem[]> {
  const items = await apiRequest.requestJson<FavoriteProductItem[]>({
    client: "backend",
    method: "GET",
    url: "/products/favorites",
    fallbackMessage: "Failed to fetch favorite products",
  })
  // Same malformed-200 guard as getMyFavoriteProductIds above.
  return Array.isArray(items) ? items : []
}

export async function addProductFavorite(productId: string): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "backend",
    method: "POST",
    url: `/products/${encodeURIComponent(productId)}/favorite`,
    fallbackMessage: "Failed to add product to favorites",
  })
}

export async function removeProductFavorite(productId: string): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "backend",
    method: "DELETE",
    url: `/products/${encodeURIComponent(productId)}/favorite`,
    fallbackMessage: "Failed to remove product from favorites",
  })
}
