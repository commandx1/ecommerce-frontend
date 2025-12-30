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
      <div className="w-[120px] h-[42px] bg-white border border-gray-300 rounded-l-md border-r-0 flex items-center px-3 text-sm text-gray-500">
        Categories
      </div>
    )
  }

  return (
    <div className="w-fit">
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger value={selectedCategory} className="w-fit rounded-l-md rounded-r-none border-r-0">
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
