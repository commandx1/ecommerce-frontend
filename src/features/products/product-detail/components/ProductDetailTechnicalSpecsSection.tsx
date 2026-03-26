import TechnicalSpecs from "@/features/products/product-detail/components/TechnicalSpecs"
import { PRODUCT_CERTIFICATIONS } from "../constants/product-certifications"
import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"

interface ProductDetailTechnicalSpecsSectionProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailTechnicalSpecsSection({ viewModel }: ProductDetailTechnicalSpecsSectionProps) {
  return <TechnicalSpecs technicalSpecs={viewModel.technicalSpecs} certifications={PRODUCT_CERTIFICATIONS} />
}
