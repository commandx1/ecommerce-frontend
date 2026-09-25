import { Loader2 } from "lucide-react"
import type { RefObject } from "react"
import type { NormalizedSearchProduct } from "@/lib/api/products"
import SearchResultItem from "./SearchResultItem"

interface SearchResultsProps {
  results: NormalizedSearchProduct[]
  isLoadingMore: boolean
  hasMore: boolean
  brokenImageIds: Set<string>
  loadingDetailId: string | null
  dropdownRef: RefObject<HTMLDivElement | null>
  listRef: RefObject<HTMLDivElement | null>
  onScroll: () => void
  onSelect: (product: NormalizedSearchProduct) => void
  onImageError: (key: string) => void
  onCreateNew: () => void
}

/** Scrollable result list (infinite scroll via `onScroll`) with the "create new" escape hatch. */
export default function SearchResults({
  results,
  isLoadingMore,
  hasMore,
  brokenImageIds,
  loadingDetailId,
  dropdownRef,
  listRef,
  onScroll,
  onSelect,
  onImageError,
  onCreateNew,
}: SearchResultsProps) {
  return (
    <div
      ref={dropdownRef}
      className="relative z-10 w-full mt-2 bg-surface-elevated border border-border-soft rounded-xl shadow-xl"
    >
      <div ref={listRef} onScroll={onScroll} className="p-2 max-h-96 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
          {results.length} results found
        </p>
        {results.map((product) => {
          const key = `${product.source}-${product.id}`
          return (
            <SearchResultItem
              key={key}
              product={product}
              imageBroken={brokenImageIds.has(key)}
              isLoadingDetail={loadingDetailId === product.id}
              onSelect={() => onSelect(product)}
              onImageError={() => onImageError(key)}
            />
          )
        })}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          </div>
        )}
        {!isLoadingMore && !hasMore && results.length > 0 && (
          <p className="text-center text-xs text-text-muted py-2">No more results</p>
        )}
      </div>
      <div className="border-t border-border-soft p-3">
        <button
          type="button"
          onClick={onCreateNew}
          className="w-full text-center text-sm font-medium text-brand hover:underline"
        >
          Can't find your product? Create new
        </button>
      </div>
    </div>
  )
}
