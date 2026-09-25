import { Plus, Search } from "lucide-react"
import type { RefObject } from "react"

interface NoSearchResultsProps {
  query: string
  dropdownRef: RefObject<HTMLDivElement | null>
  onCreateNew: () => void
}

export default function NoSearchResults({ query, dropdownRef, onCreateNew }: NoSearchResultsProps) {
  return (
    <div
      ref={dropdownRef}
      className="relative z-10 w-full mt-2 bg-surface-elevated border border-border-soft rounded-xl shadow-xl p-6 text-center"
    >
      <Search className="w-10 h-10 text-text-muted/70 mx-auto mb-3" />
      <p className="text-text-secondary font-medium">No results found</p>
      <p className="text-text-muted text-sm mt-1">No matching products for "{query}"</p>
      <button
        type="button"
        onClick={onCreateNew}
        className="mt-4 inline-flex items-center px-4 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create New Product
      </button>
    </div>
  )
}
