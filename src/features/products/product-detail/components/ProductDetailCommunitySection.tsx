import ProductQuestions from "@/features/products/product-detail/components/ProductQuestions"
import ProductReviews from "@/features/products/product-detail/components/ProductReviews"
import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"

interface ProductDetailCommunitySectionProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailCommunitySection({ viewModel }: ProductDetailCommunitySectionProps) {
  return (
    <>
      <ProductReviews productId={viewModel.productId} initialReviews={viewModel.reviews} />
      <ProductQuestions
        productId={viewModel.productId}
        initialQuestions={viewModel.questions}
        userProducts={viewModel.questionVendors}
      />
    </>
  )
}
