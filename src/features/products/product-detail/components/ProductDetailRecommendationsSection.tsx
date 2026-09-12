import RecentlyViewed from "@/features/products/product-detail/components/RecentlyViewed"
import RelatedProducts from "@/features/products/product-detail/components/RelatedProducts"
import type { CategoryCrumb } from "../types"

interface ProductDetailRecommendationsSectionProps {
  relatedProductSeed: number
  rootCategory?: CategoryCrumb
}

export default function ProductDetailRecommendationsSection({
  relatedProductSeed,
  rootCategory,
}: ProductDetailRecommendationsSectionProps) {
  return (
    <>
      <RelatedProducts currentProductId={relatedProductSeed} rootCategory={rootCategory} />
      <RecentlyViewed />
    </>
  )
}
