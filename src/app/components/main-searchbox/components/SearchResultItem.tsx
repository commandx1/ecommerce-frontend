"use client"

import Image from "next/image"
import Link from "next/link"
import { Barcode } from "lucide-react"

import type { SearchProduct } from "@/lib/api/product-search"

interface SearchResultItemProps {
  product: SearchProduct
  imageSrc: string
  onImageError: (productId: string) => void
  onClick: () => void
}

const SearchResultItem = ({ product, imageSrc, onImageError, onClick }: SearchResultItemProps) => {
  return (
    <Link
      href={`/products/${product.productId}`}
      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden">
          <Image
            src={imageSrc}
            alt={product.productName}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={() => onImageError(product.productId)}
          />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-steel-blue">{product.productName}</div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            {product.barcode && (
              <>
                <Barcode className="w-3 h-3" />
                <span>{product.barcode}</span>
              </>
            )}
          </div>
          <div className="text-sm font-bold text-steel-blue mt-1">
            {product.discount > 0 ? (
              <>
                <span className="line-through text-gray-400 mr-2">${product.oldPrice}</span>
                <span>
                  ${product.price} ({product.discount}% discount)
                </span>
              </>
            ) : (
              <span>${product.price}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default SearchResultItem
