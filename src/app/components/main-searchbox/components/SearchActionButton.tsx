"use client"

import { Loader2, Search } from "lucide-react"

interface SearchActionButtonProps {
  isLoading: boolean
}

const SearchActionButton = ({ isLoading }: SearchActionButtonProps) => {
  return (
    <button
      type="button"
      className="bg-steel-blue text-white px-5 rounded-r-lg hover:bg-opacity-90 flex items-center justify-center"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
    </button>
  )
}

export default SearchActionButton
