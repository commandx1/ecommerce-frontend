"use client"

import { useState } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCartStore } from "@/stores/cartStore"
import formatCurrency from "@/lib/helpers/formatCurrency"
import ClearCartConfirmModal from "./ClearCartConfirmModal"

const CartItems = () => {
  const { items, cartId, clearCart, updateQuantity, removeFromCart } = useCartStore()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleQuantityChange = (userProductId: string, currentQuantity: number, delta: number) => {
    updateQuantity(userProductId, currentQuantity + delta)
  }

  const handleConfirmClear = () => {
    clearCart()
    setShowClearConfirm(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-steel-blue">Cart Items ({items.length})</h2>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          disabled={!cartId || items.length === 0}
          className="cursor-pointer flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear cart
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const { userProduct, product, quantity } = item

          return (
            <div key={item.id} className="flex items-center space-x-4 p-4 bg-light-mint-gray rounded-lg">
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
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(userProduct.userProductId, quantity, -1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(userProduct.userProductId, quantity, 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="block font-semibold text-steel-blue">{formatCurrency(userProduct.price)}</span>
                      {userProduct.oldPrice > userProduct.price && (
                        <span className="block text-xs text-gray-400 line-through">
                          {formatCurrency(userProduct.oldPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(userProduct.userProductId)}
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
        })}
      </div>

      <ClearCartConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
      />
    </div>
  )
}

export default CartItems
