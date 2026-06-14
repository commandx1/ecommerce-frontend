"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VALID_SORT_VALUES, type SortValue } from "../../server/parse-listing-search-params"

const SORT_LABELS: Record<SortValue, string> = {
  "best-match": "Best Match",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Best Rating",
  newest: "Newest First",
  "name-asc": "Name A–Z",
}

const ALL_SORT_VALUES: SortValue[] = ["best-match", ...VALID_SORT_VALUES]

const SortSelect = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get("sort") ?? "best-match") as SortValue

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")
    if (value === "best-match") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    router.push(`/products?${params.toString()}`)
  }

  return (
    <Select value={currentSort} onValueChange={handleChange}>
      <SelectTrigger className="h-9 rounded-full border-border-soft bg-surface px-4 py-2 shadow-soft">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALL_SORT_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {SORT_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default SortSelect
