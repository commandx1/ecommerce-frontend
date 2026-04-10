"use client"

import { Search } from "lucide-react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { Input } from "@/components/ui/input"
import { useExpandableList } from "../hooks/useExpandableList"

interface ManufacturerFilterProps {
  manufacturers: string[]
}

const ManufacturerFilter = ({ manufacturers }: ManufacturerFilterProps) => {
  const { showAll, visibleItems, toggleShowAll } = useExpandableList(manufacturers)

  return (
    <div className="border-b border-border-soft p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Manufacturer</h3>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
        <Input type="text" placeholder="Search manufacturers..." className="w-full py-2 pr-4 pl-10 text-sm" />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {visibleItems.map((manufacturer) => (
          <CheckboxField key={manufacturer} id={`manufacturer-${manufacturer}`} label={manufacturer} />
        ))}
        {manufacturers.length === 0 && <p className="text-sm italic text-text-muted">No manufacturers found</p>}
      </div>
      {manufacturers.length > 8 && (
        <button type="button" onClick={toggleShowAll} className="mt-4 text-sm font-medium text-brand hover:underline">
          {showAll ? "Show less" : `Show ${manufacturers.length - 8} more manufacturers`}
        </button>
      )}
    </div>
  )
}

export default ManufacturerFilter
