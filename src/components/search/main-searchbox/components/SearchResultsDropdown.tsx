"use client"

import Link from "next/link"
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
  /** Trimmed current query, used only to label the trailing "see all" row. */
  query?: string
  /** `/products?q=...` for the current query, or `null` when there is nothing to search for. */
  seeAllHref?: string | null
  onSeeAllClick?: () => void
}

const SearchResultsDropdown = ({
  dropdownRef,
  results,
  isLoading,
  show,
  getImageSrc,
  onImageError,
  onResultClick,
  query = "",
  seeAllHref = null,
  onSeeAllClick,
}: SearchResultsDropdownProps) => {
  if (!show || (results.length === 0 && !isLoading)) {
    return null
  }

  return (
    // A floating overlay needs its own opaque surface (the app's floating-panel tokens), or results
    // render unreadably on top of the page.
    <div
      ref={dropdownRef}
      className="absolute left-0 z-10 mt-1 max-h-[70vh] w-full overflow-y-auto rounded-2xl border border-border-soft bg-surface-elevated px-1 shadow-panel sm:max-h-96"
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
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              data-menu-item
              onClick={onSeeAllClick}
              className="block border-t border-border-soft px-3 py-2.5 text-center text-sm font-semibold text-brand transition-colors hover:bg-surface-muted/80 sm:px-4 sm:py-3"
            >
              See all results for “{query}”
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-text-secondary">No results found</div>
      )}
    </div>
  )
}

export default SearchResultsDropdown
