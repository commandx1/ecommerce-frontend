import { Eye, Heart, Scale, Star, Truck } from "lucide-react"
import Link from "next/link"

import { getFullImageUrl } from "@/lib/api/products"

import ProductImageWithFallback from "../ProductImageWithFallback"
import type { APIProduct } from "../ProductListingClient"

interface ProductCardProps {
  product: APIProduct
  viewType: "grid" | "list"
}

const ProductCard = ({ product, viewType }: ProductCardProps) => {
  const imageSrc = product.coverPhotoPath
    ? getFullImageUrl(product.coverPhotoPath)
    : "/dentypro-product-placeholder.png"

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group ${viewType === "list" ? "shrink-0 flex" : ""}`}
    >
      <div className={`relative bg-light-mint-gray ${viewType === "list" ? "w-64 shrink-0" : "h-64"}`}>
        <ProductImageWithFallback
          src={imageSrc}
          alt={product.productName}
          fill
          className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
        />
        <button
          type="button"
          className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white text-gray-400 hover:text-red-500 transition-all"
        >
          <Heart className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 right-4">
          <div
            className={`px-2 py-1 rounded text-xs font-bold flex items-center shadow-sm ${product.stock > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
          >
            <div className={`w-2 h-2 rounded-full mr-1.5 ${product.stock > 0 ? "bg-green-500" : "bg-gray-500"}`} />
            {product.stock > 0 ? "In Stock" : "Out of Stock"}
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <span className="text-xs font-bold text-steel-blue bg-steel-blue/10 px-2 py-1 rounded uppercase tracking-wider">
            {product.brand || "Generic"}
          </span>
          <h3 className="text-lg font-bold text-steel-blue mt-2 mb-1 group-hover:text-blue-700 transition-colors">
            <Link href={`/products/${product.productId}`}>{product.productName}</Link>
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">
            High-quality product from {product.brand || "verified supplier"}
          </p>
        </div>

        <div className="flex items-center mb-4">
          <div className="flex text-yellow-400 mr-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.floor(product.overallStar) ? "fill-current" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-600">
            {product.overallStar} ({product.reviewCount} reviews)
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-steel-blue">${product.price.toFixed(2)}</span>
              {product.oldPrice > product.price && (
                <span className="text-sm text-gray-400 line-through ml-2">${product.oldPrice.toFixed(2)}</span>
              )}
            </div>
            {product.oldPrice > product.price && (
              <div className="text-sm text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                Save {Math.round((1 - product.price / product.oldPrice) * 100)}%
              </div>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
            <Truck className="w-3.5 h-3.5 text-steel-blue mr-2" />
            <span>Free shipping available</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 bg-steel-blue text-white py-2.5 rounded-xl hover:bg-opacity-90 font-bold text-sm transition-all shadow-md active:scale-95"
            >
              Add to Cart
            </button>
            <Link
              href={`/products/${product.productId}`}
              className="w-11 h-11 border border-steel-blue/30 text-steel-blue rounded-xl hover:bg-steel-blue hover:text-white transition-all flex items-center justify-center"
            >
              <Eye className="w-5 h-5" />
            </Link>
            <button
              type="button"
              className="w-11 h-11 border border-gray-200 text-gray-400 rounded-xl hover:border-steel-blue hover:text-steel-blue transition-all flex items-center justify-center"
            >
              <Scale className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
