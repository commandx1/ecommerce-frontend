import ProductQuestions from "@/features/products/product-detail/components/ProductQuestions"
import ProductReviews from "@/features/products/product-detail/components/ProductReviews"
import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"

interface ProductDetailCommunitySectionProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailCommunitySection({ viewModel }: ProductDetailCommunitySectionProps) {
  return (
    <>
      {/* Remount when the server-rendered vendor slice changes so the filter state stays in sync. */}
      <ProductReviews
        key={viewModel.reviewsUserProductId ?? "all"}
        productId={viewModel.productId}
        initialReviews={viewModel.reviews}
        initialUserProductId={viewModel.reviewsUserProductId}
        userProducts={viewModel.vendors}
      />
      <ProductQuestions
        productId={viewModel.productId}
        initialQuestions={viewModel.questions}
        userProducts={viewModel.vendors}
      />
    </>
  )
}
