"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CategorySelect = () => {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // To prevent hydration mismatch, we only render Radix Select on the client-side
  // Alternatively, we show a simple div/button placeholder on the server.
  if (!mounted) {
    return (
      <div className="flex h-10 w-[84px] shrink-0 items-center border-r border-border-soft bg-transparent px-2.5 text-xs font-medium text-text-secondary sm:h-11 sm:w-[132px] sm:px-4 sm:text-sm">
        Categories
      </div>
    )
  }

  return (
    <div className="w-fit shrink-0">
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger
          value={selectedCategory}
          className="h-10 min-w-[84px] rounded-r-none border-0 border-r border-border-soft bg-transparent px-2.5 text-xs font-medium text-text-secondary shadow-none backdrop-blur-0 hover:bg-surface-muted/60 focus-visible:border-transparent focus-visible:ring-0 sm:h-11 sm:min-w-[132px] sm:px-4 sm:text-sm"
        >
          <SelectValue placeholder="Categories" />
        </SelectTrigger>
        <SelectContent className="data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 data-[state=open]:zoom-in-100 duration-400">
          <SelectGroup>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="category2">Category 2</SelectItem>
            <SelectItem value="category3">Category 3</SelectItem>
            <SelectItem value="category4">Category 4</SelectItem>
            <SelectItem value="category5">Category 5</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default CategorySelect
