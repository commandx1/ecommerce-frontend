import { Barcode, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import type { NormalizedSearchProduct } from "@/lib/api/products"

interface SearchResultItemProps {
  product: NormalizedSearchProduct
  imageBroken: boolean
  isLoadingDetail: boolean
  onSelect: () => void
  onImageError: () => void
}

export default function SearchResultItem({
  product,
  imageBroken,
  isLoadingDetail,
  onSelect,
  onImageError,
}: SearchResultItemProps) {
  return (
    <button
      type="button"
      disabled={isLoadingDetail}
      onClick={onSelect}
      className="w-full flex items-center space-x-4 p-3 hover:bg-surface-muted rounded-lg transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden shrink-0">
        {product.images.length > 0 && !imageBroken ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            onError={onImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-text-muted/70" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{product.title || "Unnamed Product"}</p>
        <div className="flex items-center space-x-2 mt-1">
          {product.barcode && (
            <span className="inline-flex items-center px-2 py-0.5 bg-surface text-text-primary text-xs rounded font-mono">
              <Barcode className="w-3 h-3 mr-1" />
              {product.barcode}
            </span>
          )}
          {product.brand && <span className="text-xs text-text-muted truncate">{product.brand}</span>}
        </div>
        {product.category && <p className="text-xs text-text-muted mt-1 truncate">{product.category}</p>}
      </div>
    </button>
  )
}
