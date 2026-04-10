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
      className="rounded-r-2xl flex h-11 items-center justify-center border-l border-border-soft bg-surface-muted/70 px-5 text-brand transition-[background-color,color] hover:bg-surface-muted"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
    </button>
  )
}

export default SearchActionButton
