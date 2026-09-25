import { Loader2, Search, X } from "lucide-react"
import type { ProductSearch } from "../../hooks/useProductSearch"
import BrandFilterDropdown from "../BrandFilterDropdown"
import NoSearchResults from "./NoSearchResults"
import SearchResults from "./SearchResults"

interface ProductSearchPanelProps {
  search: ProductSearch
  accessToken: string | null
  onCreateNew: () => void
}

/** The search-first entry view: brand filter, query input and the results/no-results dropdown. */
export default function ProductSearchPanel({ search, accessToken, onCreateNew }: ProductSearchPanelProps) {
  const { searchQuery, results, showDropdown, isSearching } = search

  return (
    <div className="w-full max-w-4xl bg-surface-elevated rounded-2xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-accent-strong rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-muted" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand">Search Product</h2>
          <p className="text-sm text-text-muted">Search existing products by barcode or product name</p>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-stretch gap-2">
          <BrandFilterDropdown
            value={search.selectedBrand}
            onChange={search.setSelectedBrand}
            accessToken={accessToken}
          />

          <div className="relative flex-1">
            <input
              ref={search.searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => search.setSearchQuery(e.target.value)}
              onFocus={search.reopenDropdown}
              placeholder="Search by barcode, name, detailed name, or manufacturer code..."
              className="w-full px-4 py-3 pl-12 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-text-muted" />
              )}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={search.clearQuery}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showDropdown && results.length > 0 && (
          <SearchResults
            results={results}
            isLoadingMore={search.isLoadingMore}
            hasMore={search.hasMore}
            brokenImageIds={search.brokenImageIds}
            loadingDetailId={search.loadingDetailId}
            dropdownRef={search.dropdownRef}
            listRef={search.resultsListRef}
            onScroll={search.handleResultsScroll}
            onSelect={search.selectResult}
            onImageError={search.markImageBroken}
            onCreateNew={onCreateNew}
          />
        )}

        {showDropdown && results.length === 0 && !isSearching && search.debouncedQuery.trim() && (
          <NoSearchResults query={search.debouncedQuery} dropdownRef={search.dropdownRef} onCreateNew={onCreateNew} />
        )}
      </div>
    </div>
  )
}
