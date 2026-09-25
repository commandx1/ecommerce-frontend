import { ShieldAlert, ShieldCheck, Trash2 } from "lucide-react"
import Link from "next/link"
import NotificationCard from "@/components/feedback/NotificationCard"
import QuantityStepper from "@/components/ui/QuantityStepper"
import CartItemAutoOrder from "@/features/cart/components/CartItemAutoOrder"
import CartItemPrice from "@/features/cart/components/CartItemPrice"
import type { CartItemCardProps } from "@/features/cart/types"
import { getCartItemAlerts } from "@/features/cart/utils/cart-alerts"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import { getFullImageUrl } from "@/lib/api/products"

export default function CartItemCard({
  item,
  requiresLicense,
  isLicenseBlocked,
  onAutoOrderChange,
  onQuantityChange,
  onRemoveItem,
}: CartItemCardProps) {
  const { userProduct, product, quantity } = item
  const productDetailHref = `/products/${product.id}?vendorId=${encodeURIComponent(userProduct.userProductId)}`
  const productImageSrc = getFullImageUrl(product.coverPhotoPath)
  const { productAlert, stockAlert, userProductAlert } = getCartItemAlerts(item)
  const hasAlerts = Boolean(productAlert || stockAlert || userProductAlert)

  return (
    <div className="rounded-[1.25rem] border border-border-soft bg-surface p-4 shadow-soft">
      <div className="flex items-start space-x-4">
        <Link
          href={productDetailHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border-soft bg-surface-elevated"
        >
          <ProductImageWithFallback
            src={productImageSrc}
            alt={product.name}
            width={64}
            height={64}
            className="w-12 h-12 object-contain"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={productDetailHref} target="_blank" rel="noopener noreferrer">
            <h3 className="truncate text-sm font-medium text-text-primary transition-colors hover:text-brand">
              {product.name}
            </h3>
          </Link>

          {requiresLicense ? (
            <span
              className={
                isLicenseBlocked
                  ? "mt-1 inline-flex items-center gap-1 rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-xs font-medium text-text-primary animate-pulse"
                  : "mt-1 inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary"
              }
            >
              {isLicenseBlocked ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              License required
            </span>
          ) : null}

          {hasAlerts ? (
            <div className="mt-2 space-y-2">
              {productAlert ? (
                <NotificationCard
                  tone="error"
                  title="This product is no longer active"
                  description={productAlert}
                  className="rounded-lg px-3 py-2"
                />
              ) : null}
              {stockAlert ? (
                <NotificationCard
                  tone="error"
                  title="This item is out of stock"
                  description={stockAlert}
                  className="rounded-lg px-3 py-2"
                />
              ) : null}
              {userProductAlert ? (
                <NotificationCard
                  tone="error"
                  title="This seller listing is no longer active"
                  description={userProductAlert}
                  className="rounded-lg px-3 py-2"
                />
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <QuantityStepper
              value={quantity}
              onDecrease={() => onQuantityChange(userProduct.userProductId, quantity, -1)}
              onIncrease={() => onQuantityChange(userProduct.userProductId, quantity, 1)}
            />
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <CartItemPrice
                oldPrice={userProduct.oldPrice}
                price={userProduct.price}
                discount={userProduct.discount}
                quantity={quantity}
                shipmentFee={userProduct.shipmentFee}
                heavyShippingSurcharge={userProduct.heavyShippingSurcharge ?? 0}
              />
              <button
                type="button"
                onClick={() => onRemoveItem(userProduct.userProductId)}
                className="text-danger transition-colors hover:brightness-90"
                aria-label="Remove item"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <CartItemAutoOrder
            userProductId={userProduct.userProductId}
            value={item.autoOrder}
            onChange={onAutoOrderChange}
            disabled={hasAlerts}
          />
        </div>
      </div>
    </div>
  )
}
