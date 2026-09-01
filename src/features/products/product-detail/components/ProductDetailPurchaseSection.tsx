import PurchaseOptions from "@/features/products/product-detail/components/PurchaseOptions"
import formatCurrency from "@/lib/helpers/formatCurrency"
import type { ProductDetailPageViewModel } from "../server/build-product-detail-view-model"

interface ProductDetailPurchaseSectionProps {
  viewModel: ProductDetailPageViewModel
}

export default function ProductDetailPurchaseSection({ viewModel }: ProductDetailPurchaseSectionProps) {
  const unitPrice = viewModel.productPrice

  return (
    <PurchaseOptions
      bulkPricing={[
        {
          id: 1,
          range: "1 Unit",
          price: formatCurrency(unitPrice),
          note: "Each",
          selected: false,
        },
        {
          id: 2,
          range: "2-4 Units",
          price: formatCurrency(unitPrice * 0.9),
          note: "Save $100 each",
          selected: true,
        },
        {
          id: 3,
          range: "5+ Units",
          price: formatCurrency(unitPrice * 0.8),
          note: "Save $200 each",
          selected: false,
        },
      ]}
      orderSummary={{
        product: viewModel.productName,
        productPrice: String(unitPrice),
        shipping: "0",
        subtotal: String(unitPrice),
        total: String(unitPrice),
      }}
      suppliers={viewModel.suppliers}
      bestPriceVendorUserProductId={viewModel.bestPriceVendorUserProductId}
    />
  )
}
