import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"
import ProductDetailCommunitySection from "./ProductDetailCommunitySection"
import ProductDetailHeroSection from "./ProductDetailHeroSection"
import ProductDetailPurchaseSection from "./ProductDetailPurchaseSection"
import ProductDetailRecommendationsSection from "./ProductDetailRecommendationsSection"

interface ProductDetailPageViewProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailPageView({ viewModel }: ProductDetailPageViewProps) {
  return (
    // `<main>`, not a Fragment: this route had no main landmark at all (axe `landmark-one-main`),
    // so a screen-reader user had no "skip to main content" target. Purely semantic - block-level
    // like the Fragment's children already were, no visual change.
    <main>
      <ProductDetailHeroSection viewModel={viewModel} />
      <ProductDetailPurchaseSection viewModel={viewModel} />
      <ProductDetailCommunitySection viewModel={viewModel} />
      <ProductDetailRecommendationsSection relatedProductSeed={viewModel.relatedProductSeed} />
    </main>
  )
}
