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
      <div className="flex h-11 w-[132px] items-center border-r border-border-soft bg-transparent px-4 text-sm font-medium text-text-secondary">
        Categories
      </div>
    )
  }

  return (
    <div className="w-fit">
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger
          value={selectedCategory}
          className="h-11 min-w-[132px] rounded-r-none border-0 border-r border-border-soft bg-transparent font-medium text-text-secondary shadow-none backdrop-blur-0 hover:bg-surface-muted/60 focus-visible:border-transparent focus-visible:ring-0"
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
