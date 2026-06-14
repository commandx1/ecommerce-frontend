"use client"

import { Search } from "lucide-react"
import { useId, useState } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { Input } from "@/components/ui/input"
import { useExpandableList } from "../hooks/useExpandableList"
import { useProductFiltersNavigation } from "../hooks/useProductFiltersNavigation"

interface BrandFilterProps {
  brands: string[]
}

const BrandFilter = ({ brands }: BrandFilterProps) => {
  const uid = useId()
  const [search, setSearch] = useState("")
  const { navigate, currentBrands } = useProductFiltersNavigation()
  const filtered = search ? brands.filter((b) => b.toLowerCase().includes(search.toLowerCase())) : brands
  const { showAll, visibleItems, toggleShowAll } = useExpandableList(filtered)

  const toggle = (brand: string) => {
    const next = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand]
    navigate({ brands: next })
  }

  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Brand</h3>
        {currentBrands.length > 0 && (
          <button
            type="button"
            onClick={() => navigate({ brands: [] })}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
        <Input
          type="text"
          placeholder="Search brands..."
          className="w-full py-2 pr-4 pl-10 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {visibleItems.map((brand) => (
          <CheckboxField
            key={brand}
            id={`${uid}-brand-${brand}`}
            label={brand}
            checked={currentBrands.includes(brand)}
            onChange={() => toggle(brand)}
          />
        ))}
        {filtered.length === 0 && <p className="text-sm italic text-text-muted">No brands found</p>}
      </div>
      {filtered.length > 8 && (
        <button type="button" onClick={toggleShowAll} className="mt-4 text-sm font-medium text-brand hover:underline">
          {showAll ? "Show less" : `Show ${filtered.length - 8} more brands`}
        </button>
      )}
    </div>
  )
}

export default BrandFilter
