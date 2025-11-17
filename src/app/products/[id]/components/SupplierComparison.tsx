"use client"

import Image from "next/image"
import { useParams } from "next/navigation"
import { useCartStore } from "@/stores/cartStore"

interface Supplier {
  id: number
  name: string
  logo: string
  alt: string
  badge: string
  price: string
  originalPrice: string | null
  stock: string
  stockColor: string
  shipping: string
  shippingNote: string
  leadTime: string
  rating: number
  starCount: number
}

interface SupplierComparisonProps {
  suppliers: Supplier[]
}

const SupplierComparison = ({ suppliers }: SupplierComparisonProps) => {
  const params = useParams()
  const productId = params?.id as string
  const addToCart = useCartStore((state) => state.addToCart)

  const handleAddToCart = () => {
    if (productId) {
      addToCart(productId, 1)
    }
  }

  const renderStars = (starCount: number, supplierName: string) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `${supplierName}-star-${i + 1}`
      return (
        <svg
          key={starId}
          className={`w-4 h-4 ${i < starCount ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>{i < starCount ? "Filled star" : "Empty star"}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )
    })
  }

  const getStockColorClass = (color: string) => {
    if (color === "green") return "bg-green-100 text-green-800"
    if (color === "yellow") return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <section id="supplier-comparison" className="bg-white py-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-steel-blue mb-4">Compare Suppliers & Pricing</h2>
          <p className="text-gray-600">
            Multiple verified suppliers offer this product. Compare pricing, shipping, and terms to find the best deal.
          </p>
        </div>

        <div className="bg-light-mint-gray rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-steel-blue text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Supplier</th>
                  <th className="px-6 py-4 text-center font-semibold">Price</th>
                  <th className="px-6 py-4 text-center font-semibold">Stock</th>
                  <th className="px-6 py-4 text-center font-semibold">Shipping</th>
                  <th className="px-6 py-4 text-center font-semibold">Lead Time</th>
                  <th className="px-6 py-4 text-center font-semibold">Rating</th>
                  <th className="px-6 py-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-light-mint-gray rounded-lg flex items-center justify-center">
                          <Image
                            className="w-8 h-8 object-contain"
                            src={supplier.logo}
                            alt={supplier.alt}
                            width={32}
                            height={32}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-steel-blue">{supplier.name}</div>
                          <div className="text-sm text-gray-600">{supplier.badge}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-2xl text-steel-blue">{supplier.price}</div>
                      {supplier.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">{supplier.originalPrice}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`${getStockColorClass(supplier.stockColor)} px-3 py-1 rounded-full text-sm font-medium`}
                      >
                        {supplier.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium">{supplier.shipping}</div>
                      <div className="text-xs text-gray-500">{supplier.shippingNote}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium">{supplier.leadTime}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <div className="flex text-yellow-400 text-sm">
                          {renderStars(supplier.starCount, supplier.name)}
                        </div>
                        <span className="text-sm text-gray-600">{supplier.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="bg-steel-blue text-white px-6 py-2 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
                      >
                        Add to Cart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SupplierComparison
