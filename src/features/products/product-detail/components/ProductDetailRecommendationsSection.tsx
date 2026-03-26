import RecentlyViewed from "@/features/products/product-detail/components/RecentlyViewed"
import RelatedProducts from "@/features/products/product-detail/components/RelatedProducts"

interface ProductDetailRecommendationsSectionProps {
  relatedProductSeed: number
}

export default function ProductDetailRecommendationsSection({
  relatedProductSeed,
}: ProductDetailRecommendationsSectionProps) {
  return (
    <>
      <RelatedProducts currentProductId={relatedProductSeed} />
      <RecentlyViewed />
    </>
  )
}
