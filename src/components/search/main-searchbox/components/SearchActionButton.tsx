"use client"

import { Loader2, Search } from "lucide-react"

interface SearchActionButtonProps {
  isLoading: boolean
}

const SearchActionButton = ({ isLoading }: SearchActionButtonProps) => {
  return (
    <button
      type="button"
      aria-label="Search products"
      className="flex h-10 shrink-0 items-center justify-center rounded-r-xl border-l border-border-soft bg-surface-muted/70 px-3.5 text-brand transition-[background-color,color] hover:bg-surface-muted sm:h-11 sm:rounded-r-2xl sm:px-5"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
    </button>
  )
}

export default SearchActionButton
