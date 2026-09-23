"use client"

import type { RefObject } from "react"

import type { SearchProduct } from "@/lib/api/product-search"

import SearchResultItem from "./SearchResultItem"

interface SearchResultsDropdownProps {
  dropdownRef: RefObject<HTMLDivElement | null>
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
      className="absolute left-0 z-10 mt-1 max-h-[70vh] w-full overflow-y-auto border-t border-border-soft/60 px-1 sm:max-h-96"
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
