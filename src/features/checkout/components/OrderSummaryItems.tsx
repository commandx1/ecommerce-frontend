import Image from "next/image"
import Link from "next/link"
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
    <div className="space-y-4 mb-6">
      {items.map((item) => {
        const { product, userProduct, quantity } = item
        const sellerMeta = userProduct as UserProductSellerMeta
        const totalPrice = userProduct.price * quantity

        return (
          <div key={item.id} className="flex items-center space-x-4 p-4 bg-light-mint-gray rounded-lg">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0">
              <Image
                src={product.coverPhotoPath}
                alt={product.name}
                width={64}
                height={64}
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/products/${product.id}`}>
                <h4 className="font-medium text-gray-900 text-sm hover:text-steel-blue truncate">{product.name}</h4>
              </Link>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">Qty: {quantity}</span>
                <span className="font-semibold text-steel-blue">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Seller: {sellerMeta.sellerName || sellerMeta.vendor || "Standard Seller"}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
