"use client"

import { Barcode } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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
      className="block px-4 py-3 transition-colors hover:bg-surface-muted/80"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xs border border-border-soft bg-surface-muted">
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
          <div className="font-semibold text-text-primary">{product.productName}</div>
          <div className="flex items-center gap-1 text-sm text-text-secondary">
            {product.barcode && (
              <>
                <Barcode className="w-3 h-3" />
                <span>{product.barcode}</span>
              </>
            )}
          </div>
          <div className="mt-1 text-sm font-bold text-brand">
            {product.discount > 0 ? (
              <>
                <span className="mr-2 line-through text-text-muted">${product.oldPrice}</span>
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
