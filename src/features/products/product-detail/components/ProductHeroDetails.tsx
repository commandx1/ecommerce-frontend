import { Check, ShieldCheck } from "lucide-react"
import Link from "next/link"
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
  const selectedPriceLabel = selectedSupplier?.price || formatCurrency(product.price)
  const selectedOldPriceLabel = selectedSupplier?.originalPrice || null
  const hasDiscount = Boolean(selectedSupplier && selectedSupplier.discount > 0)
  const discountPercent = selectedSupplier ? selectedSupplier.discount : 0
  const formattedDiscount = Number.isInteger(discountPercent) ? `${discountPercent}` : discountPercent.toFixed(1)

  return (
    <div className="space-y-6 rounded-4xl border border-border-soft bg-surface-elevated p-5 shadow-soft sm:p-7 md:p-8">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border-soft bg-surface px-3 py-1 text-sm font-medium text-brand">
            {product.category}
          </span>
          <span className="rounded-full bg-warning/20 px-3 py-1 text-sm font-medium text-warning">Best Seller</span>
        </div>
        <h1 className="mb-4 text-3xl font-semibold text-text-primary sm:text-4xl md:text-5xl">{product.title}</h1>
        <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{product.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <StarRating rating={product.rating} size="md" className="text-yellow-400" />
          <span className="font-semibold text-brand">{product.rating.toFixed(1)}</span>
          {/* Product-level aggregate across every vendor, unlike the vendor-scoped reviews list below. */}
          <a href="#product-reviews" className="text-text-secondary transition-colors hover:text-brand">
            ({product.reviewCount} reviews · all vendors)
          </a>
        </div>
        <div className="hidden h-6 w-px bg-border-soft md:block" />
        <span className="text-text-secondary">SKU: {product.sku}</span>
      </div>

      <div className="rounded-3xl border border-border-soft bg-surface p-5">
        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-muted">Selected pricing</div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-2xl font-semibold text-brand sm:text-3xl">{selectedPriceLabel}</div>
              {hasDiscount ? (
                <>
                  <span className="text-base font-medium text-text-muted line-through">{selectedOldPriceLabel}</span>
                  <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                    Save {formattedDiscount}%
                  </span>
                </>
              ) : null}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">
              {selectedSupplier ? `From ${selectedSupplier.name}` : "Base price"}
            </div>
          </div>
          {selectedSupplier ? (
            <div className="rounded-full border border-border-soft bg-surface-elevated px-3 py-1.5 text-sm text-text-secondary">
              Shipping: <span className="font-semibold text-text-primary">{selectedSupplier.shipping}</span>
            </div>
          ) : null}
        </div>
      </div>

      {selectedSupplier ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-success px-3 py-1 text-sm font-medium text-white">Selected Vendor</div>
            <div className="font-semibold text-text-primary">{selectedSupplier.name}</div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Stock:</span>
              <span className={`${getStockColorClass(selectedSupplier.stockColor)} px-2 py-1 rounded-full font-medium`}>
                {selectedSupplier.stock}
              </span>
            </div>
            {selectedSupplier.distance && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Distance:</span>
                <span className="font-medium text-brand">{selectedSupplier.distance}</span>
              </div>
            )}
            {selectedSupplier.distanceTime && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Estimated Time:</span>
                <span className="font-medium text-brand">{selectedSupplier.distanceTime}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        product.bestPriceVendor && (
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-success px-3 py-1 text-sm font-medium text-white">Lowest Price</div>
            <div>{product.bestPriceVendor}</div>
          </div>
        )
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {product.features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-3 rounded-[1.15rem] border border-border-soft bg-surface px-3 py-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15">
              <Check className="h-4 w-4 text-success" />
            </div>
            <span className="text-text-secondary">{feature}</span>
          </div>
        ))}
      </div>

      {product.dentalLicenseRequired ? (
        <NoticeBanner
          tone="warning"
          title="License Required"
          icon={<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />}
        >
          <p className="text-sm text-yellow-700">
            This product requires verification of your dental license to view pricing and place orders.{" "}
            <Link href="/buyer-dashboard/settings" className="font-medium underline">
              Complete verification
            </Link>{" "}
            to access exclusive professional pricing.
          </p>
        </NoticeBanner>
      ) : null}
    </div>
  )
}

export default ProductHeroDetails
