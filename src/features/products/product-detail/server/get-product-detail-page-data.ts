import { cache } from "react"
import { fetchProductDetailPageData } from "@/lib/api/product-detail"

export const getProductDetailPageData = cache(async (id: string) => fetchProductDetailPageData(id))
