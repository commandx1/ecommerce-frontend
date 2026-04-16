import { Trash2 } from "lucide-react"
import Link from "next/link"
import NotificationCard from "@/components/feedback/NotificationCard"
import CartItemPrice from "@/features/cart/components/CartItemPrice"
import CartItemQuantityControl from "@/features/cart/components/CartItemQuantityControl"
import type { CartItemCardProps } from "@/features/cart/types"
import { getCartItemAlerts } from "@/features/cart/utils/cart-alerts"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import { getFullImageUrl } from "@/lib/api/products"

export default function CartItemCard({ item, onQuantityChange, onRemoveItem }: CartItemCardProps) {
  const { userProduct, product, quantity } = item
  const productDetailHref = `/products/${product.id}?vendorId=${encodeURIComponent(userProduct.userProductId)}`
  const productImageSrc = getFullImageUrl(product.coverPhotoPath) || "/dentypro-product-placeholder.png"
  const { productAlert, stockAlert, userProductAlert } = getCartItemAlerts(item)
  const hasAlerts = Boolean(productAlert || stockAlert || userProductAlert)

  return (
    <div className="rounded-[1.25rem] border border-border-soft bg-surface p-4 shadow-soft">
      <div className="flex items-start space-x-4">
        <Link
          href={productDetailHref}
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
          <Link href={productDetailHref}>
            <h3 className="truncate text-sm font-medium text-text-primary transition-colors hover:text-brand">
              {product.name}
            </h3>
          </Link>

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

          <div className="mt-2 flex items-center justify-between">
            <CartItemQuantityControl
              quantity={quantity}
              onDecrease={() => onQuantityChange(userProduct.userProductId, quantity, -1)}
              onIncrease={() => onQuantityChange(userProduct.userProductId, quantity, 1)}
            />
            <div className="flex items-center space-x-4">
              <CartItemPrice
                oldPrice={userProduct.oldPrice}
                price={userProduct.price}
                discount={userProduct.discount}
                quantity={quantity}
                shipmentFee={userProduct.shipmentFee}
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
        </div>
      </div>
    </div>
  )
}
