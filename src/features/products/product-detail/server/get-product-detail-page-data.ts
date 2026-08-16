import { cache } from "react"
import { fetchProductDetailPageData, fetchProductReviews } from "@/lib/api/product-detail"

export const getProductDetailPageData = cache(async (id: string) => fetchProductDetailPageData(id))

export const getProductReviews = cache(async (id: string, userProductId?: string) =>
  fetchProductReviews(id, userProductId),
)
