import Breadcrumb from "@/features/products/product-detail/components/Breadcrumb"
import ProductWithSuppliers from "@/features/products/product-detail/components/ProductWithSuppliers"
import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"

interface ProductDetailHeroSectionProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailHeroSection({ viewModel }: ProductDetailHeroSectionProps) {
  return (
    <>
      <Breadcrumb
        product={{
          title: viewModel.productName,
          category: viewModel.productCategory,
        }}
      />
      <ProductWithSuppliers
        product={viewModel.productHero}
        suppliers={viewModel.suppliers}
        bestPriceVendorUserProductId={viewModel.bestPriceVendorUserProductId}
      />
    </>
  )
}
