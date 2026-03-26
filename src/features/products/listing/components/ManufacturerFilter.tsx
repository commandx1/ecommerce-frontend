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
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Manufacturer</h3>
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <Input
          type="text"
          placeholder="Search manufacturers..."
          className="w-full pl-10 pr-4 py-2 border-gray-300 text-sm"
        />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {visibleItems.map((manufacturer) => (
          <CheckboxField key={manufacturer} id={`manufacturer-${manufacturer}`} label={manufacturer} />
        ))}
        {manufacturers.length === 0 && <p className="text-sm text-gray-500 italic">No manufacturers found</p>}
      </div>
      {manufacturers.length > 8 && (
        <button
          type="button"
          onClick={toggleShowAll}
          className="text-steel-blue text-sm hover:underline mt-4 font-medium"
        >
          {showAll ? "Show less" : `Show ${manufacturers.length - 8} more manufacturers`}
        </button>
      )}
    </div>
  )
}

export default ManufacturerFilter
