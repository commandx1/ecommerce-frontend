import type { ProductDetailPageData, VariantAttributesResponse } from "@/features/products/product-detail/types"
import { apiRequest } from "./request"

export interface MatchVariantAttributeParams {
  productId: string
  chosenAttribute: string
  chosenAttributeValue: string
  /** Required when the chosen value is ambiguous (several products share it) - without it the
   *  backend picks the first matching candidate in an unordered query (SVC:1179). */
  productName?: string
}

export async function fetchVariantAttributes(productId: string): Promise<VariantAttributesResponse> {
  return apiRequest.requestJson<VariantAttributesResponse>({
    client: "backend",
    method: "POST",
    url: "/products/variant-attributes",
    data: { productId },
    fallbackMessage: "Failed to fetch variant attributes",
  })
}

// Response body is byte-for-byte ProductWithUserProductsDto - the same shape GET
// /products/{id}/with-user-products returns - so it's typed as ProductDetailPageData["productData"].
export async function matchVariantAttribute(
  params: MatchVariantAttributeParams,
): Promise<ProductDetailPageData["productData"]> {
  return apiRequest.requestJson<ProductDetailPageData["productData"]>({
    client: "backend",
    method: "POST",
    url: "/products/variant-attributes/match",
    data: params,
    fallbackMessage: "Failed to switch product variant",
  })
}
