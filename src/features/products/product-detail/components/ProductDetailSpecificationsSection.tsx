import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"
import ProductSpecifications from "./ProductSpecifications"

interface ProductDetailSpecificationsSectionProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailSpecificationsSection({ viewModel }: ProductDetailSpecificationsSectionProps) {
  if (viewModel.specifications.length === 0 && !viewModel.sdsUrl) return null

  return (
    <PageSectionContainer as="section" id="specifications" className="scroll-mt-24 bg-canvas py-12">
      <SectionHeading
        title="Specifications"
        titleClassName="mb-2 md:text-3xl font-semibold text-text-primary"
        className="mb-8"
      />
      <ProductSpecifications specifications={viewModel.specifications} sdsUrl={viewModel.sdsUrl} />
    </PageSectionContainer>
  )
}
