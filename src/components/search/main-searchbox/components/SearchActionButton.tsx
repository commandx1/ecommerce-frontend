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
      className="relative z-10 flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full px-3.5 text-brand transition-colors hover:text-brand/70 sm:h-11 sm:px-4"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
    </button>
  )
}

export default SearchActionButton
