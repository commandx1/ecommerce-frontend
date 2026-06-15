"use client"

import { useId, useState } from "react"
import { Search } from "lucide-react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { Input } from "@/components/ui/input"
import type { VendorOption } from "@/lib/api/public-products"
import { useExpandableList } from "../hooks/useExpandableList"
import { useProductFiltersNavigation } from "../hooks/useProductFiltersNavigation"

interface VendorFilterProps {
  vendors: VendorOption[]
}

const VendorFilter = ({ vendors }: VendorFilterProps) => {
  const uid = useId()
  const [search, setSearch] = useState("")
  const { navigate, currentVendors } = useProductFiltersNavigation()

  const filtered = search
    ? vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
    : vendors
  const { showAll, visibleItems, toggleShowAll } = useExpandableList(filtered)

  const toggle = (id: string) => {
    const next = currentVendors.includes(id)
      ? currentVendors.filter((v) => v !== id)
      : [...currentVendors, id]
    navigate({ vendors: next })
  }

  if (vendors.length === 0) return null

  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Vendor</h3>
        {currentVendors.length > 0 && (
          <button
            type="button"
            onClick={() => navigate({ vendors: [] })}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {vendors.length > 8 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <Input
            type="text"
            placeholder="Search vendors..."
            className="w-full py-2 pr-4 pl-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {visibleItems.map((option) => (
          <div key={option.id} className="flex items-center justify-between gap-2">
            <CheckboxField
              id={`${uid}-vendor-${option.id}`}
              label={option.name}
              checked={currentVendors.includes(option.id)}
              onChange={() => toggle(option.id)}
            />
            <span className="shrink-0 text-xs text-text-muted">{option.count}</span>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm italic text-text-muted">No vendors found</p>}
      </div>
      {filtered.length > 8 && (
        <button type="button" onClick={toggleShowAll} className="mt-4 text-sm font-medium text-brand hover:underline">
          {showAll ? "Show less" : `Show ${filtered.length - 8} more vendors`}
        </button>
      )}
    </div>
  )
}

export default VendorFilter
