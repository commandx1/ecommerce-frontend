import { Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import CartItemPrice from "@/features/cart/components/CartItemPrice"
import CartItemQuantityControl from "@/features/cart/components/CartItemQuantityControl"
import type { CartItemCardProps } from "@/features/cart/types"

export default function CartItemCard({ item, onQuantityChange, onRemoveItem }: CartItemCardProps) {
  const { userProduct, product, quantity } = item

  return (
    <div className="flex items-center space-x-4 p-4 bg-light-mint-gray rounded-lg">
      <Link
        href={`/products/${product.id}`}
        className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0"
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
          <h3 className="font-medium text-gray-900 text-sm hover:text-steel-blue truncate">{product.name}</h3>
        </Link>

        <div className="flex items-center justify-between mt-2">
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
              className="text-red-500 hover:text-red-700"
              aria-label="Remove item"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
