"use client"

import type { RefObject } from "react"

import type { SearchProduct } from "@/lib/api/product-search"

import SearchResultItem from "./SearchResultItem"

interface SearchResultsDropdownProps {
  dropdownRef: RefObject<HTMLDivElement>
  results: SearchProduct[]
  isLoading: boolean
  show: boolean
  getImageSrc: (product: SearchProduct) => string
  onImageError: (productId: string) => void
  onResultClick: () => void
}

const SearchResultsDropdown = ({
  dropdownRef,
  results,
  isLoading,
  show,
  getImageSrc,
  onImageError,
  onResultClick,
}: SearchResultsDropdownProps) => {
  if (!show || (results.length === 0 && !isLoading)) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-3 max-h-96 w-full overflow-y-auto rounded-2xl border border-border-soft bg-surface-elevated/98 shadow-panel backdrop-blur-xl"
    >
      {results.length > 0 ? (
        <div className="py-2">
          {results.map((product) => (
            <SearchResultItem
              key={product.productId}
              product={product}
              imageSrc={getImageSrc(product)}
              onImageError={onImageError}
              onClick={onResultClick}
            />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-text-secondary">No results found</div>
      )}
    </div>
  )
}

export default SearchResultsDropdown
