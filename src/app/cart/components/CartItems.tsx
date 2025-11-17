"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import productsData from "@/data/products.json"
import { useCartStore } from "@/stores/cartStore"

const CartItems = () => {
  const { items, updateQuantity, removeFromCart } = useCartStore()

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId)
    if (item) {
      updateQuantity(itemId, item.quantity + delta)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-steel-blue mb-6">Cart Items ({items.length})</h2>
      <div className="space-y-4">
        {items.map((item) => {
          const product = productsData.find((p) => p.id === item.productId)
          if (!product) return null

          return (
            <div key={item.id} className="flex items-center space-x-4 p-4 bg-light-mint-gray rounded-lg">
              <Link
                href={`/products/${item.productId}`}
                className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0"
              >
                <Image
                  src={product.mainImage}
                  alt={product.alt}
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`}>
                  <h3 className="font-medium text-gray-900 text-sm hover:text-steel-blue">{product.title}</h3>
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-steel-blue">{product.price}</span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
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
    </div>
  )
}

export default CartItems
