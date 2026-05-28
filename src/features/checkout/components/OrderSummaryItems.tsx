import Link from "next/link"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import { getFullImageUrl } from "@/lib/api/products"
import formatCurrency from "@/lib/helpers/formatCurrency"
import type { CartItem } from "@/stores/cartStore"

interface UserProductSellerMeta {
  sellerName?: string
  vendor?: string
}

interface OrderSummaryItemsProps {
  items: CartItem[]
}

export default function OrderSummaryItems({ items }: OrderSummaryItemsProps) {
  return (
    <div className="mb-6 space-y-4">
      {items.map((item) => {
        const { product, userProduct, quantity } = item
        const sellerMeta = userProduct as UserProductSellerMeta
        const totalPrice = userProduct.price * quantity
        const productImageSrc = getFullImageUrl(product.coverPhotoPath) || "/dentypro-product-placeholder.png"

        return (
          <div
            key={item.id}
            className="flex items-center space-x-4 rounded-[1.25rem] border border-border-soft bg-surface p-4"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-surface-elevated">
              <ProductImageWithFallback
                src={productImageSrc}
                alt={product.name}
                width={64}
                height={64}
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer">
                <h4 className="truncate text-sm font-medium text-text-primary transition-colors hover:text-brand">
                  {product.name}
                </h4>
              </Link>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-text-muted">Qty: {quantity}</span>
                <span className="font-semibold text-brand">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-text-muted">
                Seller: {sellerMeta.sellerName || sellerMeta.vendor || "Standard Seller"}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
