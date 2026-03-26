import type { Metadata } from "next"
import type { ProductDetailPageData } from "@/features/products/product-detail/types"

export function buildProductDetailMetadata(data: ProductDetailPageData): Metadata {
  const productName = data.productData.product.name || "Product Detail"
  const productDescription =
    data.productData.product.aboutProduct ||
    data.productData.product.description ||
    "Detailed information, supplier options, and reviews for this product."

  return {
    title: productName,
    description: productDescription,
  }
}

export const FALLBACK_PRODUCT_DETAIL_METADATA: Metadata = {
  title: "Product Detail",
  description: "Detailed information about this product.",
}
