"use client"

import { Barcode } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { SearchProduct } from "@/lib/api/product-search"
import formatCurrency from "@/lib/helpers/formatCurrency"

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
      className="block px-3 py-2.5 transition-colors hover:bg-surface-muted/80 sm:px-4 sm:py-3"
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xs border border-border-soft bg-surface-muted sm:h-12 sm:w-12">
          <Image
            src={imageSrc}
            alt={product.productName}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={() => onImageError(product.productId)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-text-primary sm:text-base">{product.productName}</div>
          <div className="flex items-center gap-1 text-xs text-text-secondary sm:text-sm">
            {product.barcode && (
              <>
                <Barcode className="w-3 h-3 shrink-0" />
                <span className="truncate">{product.barcode}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs font-bold text-brand sm:text-sm">
            {product.discount > 0 ? (
              <>
                <span className="line-through text-text-muted">{formatCurrency(product.oldPrice)}</span>
                <span>
                  {formatCurrency(product.price)} ({Math.round(product.discount)}% discount)
                </span>
              </>
            ) : (
              <span>{formatCurrency(product.price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default SearchResultItem
