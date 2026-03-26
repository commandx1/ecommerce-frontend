import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"
import ProductDetailCommunitySection from "./ProductDetailCommunitySection"
import ProductDetailHeroSection from "./ProductDetailHeroSection"
import ProductDetailPurchaseSection from "./ProductDetailPurchaseSection"
import ProductDetailRecommendationsSection from "./ProductDetailRecommendationsSection"
import ProductDetailTechnicalSpecsSection from "./ProductDetailTechnicalSpecsSection"

interface ProductDetailPageViewProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailPageView({ viewModel }: ProductDetailPageViewProps) {
  return (
    <>
      <ProductDetailHeroSection viewModel={viewModel} />
      <ProductDetailTechnicalSpecsSection viewModel={viewModel} />
      <ProductDetailPurchaseSection viewModel={viewModel} />
      <ProductDetailCommunitySection viewModel={viewModel} />
      <ProductDetailRecommendationsSection relatedProductSeed={viewModel.relatedProductSeed} />
    </>
  )
}
