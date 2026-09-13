import { Suspense } from "react"
import RelatedProducts from "@/features/products/product-detail/components/RelatedProducts"
import RelatedProductsSkeleton from "@/features/products/product-detail/components/RelatedProductsSkeleton"
import type { CategoryCrumb } from "../types"

interface ProductDetailRecommendationsSectionProps {
  productId: string
  categoryTrail: CategoryCrumb[]
}

export default function ProductDetailRecommendationsSection({
  productId,
  categoryTrail,
}: ProductDetailRecommendationsSectionProps) {
  return (
    <Suspense fallback={<RelatedProductsSkeleton />}>
      <RelatedProducts productId={productId} categoryTrail={categoryTrail} />
    </Suspense>
  )
}
