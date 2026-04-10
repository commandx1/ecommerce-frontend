import { Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import CartItemPrice from "@/features/cart/components/CartItemPrice"
import CartItemQuantityControl from "@/features/cart/components/CartItemQuantityControl"
import type { CartItemCardProps } from "@/features/cart/types"

export default function CartItemCard({ item, onQuantityChange, onRemoveItem }: CartItemCardProps) {
  const { userProduct, product, quantity } = item

  return (
    <div className="flex items-center space-x-4 rounded-[1.25rem] border border-border-soft bg-surface p-4 shadow-soft">
      <Link
        href={`/products/${product.id}`}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border-soft bg-surface-elevated"
      >
        <Image
          src={product.coverPhotoPath}
          alt={product.name}
          width={64}
          height={64}
          className="w-12 h-12 object-contain"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.id}`}>
          <h3 className="truncate text-sm font-medium text-text-primary transition-colors hover:text-brand">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <CartItemQuantityControl
            quantity={quantity}
            onDecrease={() => onQuantityChange(userProduct.userProductId, quantity, -1)}
            onIncrease={() => onQuantityChange(userProduct.userProductId, quantity, 1)}
          />
          <div className="flex items-center space-x-4">
            <CartItemPrice oldPrice={userProduct.oldPrice} price={userProduct.price} />
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
  )
}
