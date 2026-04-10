"use client"

import { Search } from "lucide-react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { Input } from "@/components/ui/input"
import { useExpandableList } from "../hooks/useExpandableList"

interface BrandFilterProps {
  brands: string[]
}

const BrandFilter = ({ brands }: BrandFilterProps) => {
  const { showAll, visibleItems, toggleShowAll } = useExpandableList(brands)

  return (
    <div className="border-b border-border-soft p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Brand</h3>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
        <Input type="text" placeholder="Search brands..." className="w-full py-2 pr-4 pl-10 text-sm" />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {visibleItems.map((brand) => (
          <CheckboxField key={brand} id={`brand-${brand}`} label={brand} />
        ))}
        {brands.length === 0 && <p className="text-sm italic text-text-muted">No brands found</p>}
      </div>
      {brands.length > 8 && (
        <button type="button" onClick={toggleShowAll} className="mt-4 text-sm font-medium text-brand hover:underline">
          {showAll ? "Show less" : `Show ${brands.length - 8} more brands`}
        </button>
      )}
    </div>
  )
}

export default BrandFilter
