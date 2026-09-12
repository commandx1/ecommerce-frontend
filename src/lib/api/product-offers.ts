import type { ProductDetailPageData } from "@/features/products/product-detail/types"
import { apiRequest } from "@/lib/api/request"

export async function getProductWithOffers(productId: string): Promise<ProductDetailPageData["productData"]> {
  return apiRequest.requestJson<ProductDetailPageData["productData"]>({
    client: "backend",
    method: "GET",
    url: `/products/${encodeURIComponent(productId)}/with-user-products`,
    fallbackMessage: "Failed to fetch product suppliers",
  })
}
