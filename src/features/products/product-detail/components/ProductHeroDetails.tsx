import { Check, ShieldCheck } from "lucide-react"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import formatCurrency from "@/lib/helpers/formatCurrency"
import type { ProductHeroViewModel, SupplierViewModel } from "../types"
import { getStockColorClass } from "../utils/stockStyles"
import StarRating from "./StarRating"

interface ProductHeroDetailsProps {
  product: ProductHeroViewModel
  selectedSupplier?: SupplierViewModel | null
}

const ProductHeroDetails = ({ product, selectedSupplier }: ProductHeroDetailsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <span className="bg-gray-50 text-steel-blue px-3 py-1 rounded-full text-sm font-medium">
            {product.category}
          </span>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Best Seller</span>
        </div>
        <h1 className="text-4xl font-bold text-steel-blue mb-4">{product.title}</h1>
        <p className="text-xl text-gray-600 leading-relaxed">{product.description}</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <StarRating rating={product.rating} size="md" className="text-yellow-400" />
          <span className="text-steel-blue font-semibold">{product.rating}</span>
          <span className="text-gray-600">({product.reviewCount} reviews)</span>
        </div>
        <div className="h-6 w-px bg-gray-300" />
        <span className="text-gray-600">SKU: {product.sku}</span>
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-2xl font-bold text-orange-500">{formatCurrency(product.price)}</div>
        {selectedSupplier && <div className="text-sm text-gray-600">/ {selectedSupplier.shipping} Shipping</div>}
      </div>

      {selectedSupplier ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">Selected Vendor</div>
            <div className="font-semibold text-steel-blue">{selectedSupplier.name}</div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Stock:</span>
              <span className={`${getStockColorClass(selectedSupplier.stockColor)} px-2 py-1 rounded-full font-medium`}>
                {selectedSupplier.stock}
              </span>
            </div>
            {selectedSupplier.distance && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium text-steel-blue">{selectedSupplier.distance}</span>
              </div>
            )}
            {selectedSupplier.distanceTime && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Delivery:</span>
                <span className="font-medium text-steel-blue">{selectedSupplier.distanceTime}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        product.bestPriceVendor && (
          <div className="flex items-center space-x-2">
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">Lowest Price</div>
            <div>{product.bestPriceVendor}</div>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-4">
        {product.features.map((feature) => (
          <div key={feature} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <NoticeBanner
        tone="warning"
        title="Professional Verification Required"
        icon={<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />}
      >
        <p className="text-sm text-yellow-700">
          This product requires verification of your dental license to view pricing and place orders.{" "}
          <a href="/verification" className="font-medium underline">
            Complete verification
          </a>{" "}
          to access exclusive professional pricing.
        </p>
      </NoticeBanner>
    </div>
  )
}

export default ProductHeroDetails
