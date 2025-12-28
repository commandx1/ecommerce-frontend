import { Search } from "lucide-react"
import { useState } from "react"

interface ManufacturerFilterProps {
  manufacturers: string[]
}

const ManufacturerFilter = ({ manufacturers }: ManufacturerFilterProps) => {
  const [showAll, setShowAll] = useState(false)
  const displayManufacturers = showAll ? manufacturers : manufacturers.slice(0, 8)

  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Manufacturer</h3>
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search manufacturers..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-sm"
        />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {displayManufacturers.map((manufacturer) => (
          <label key={manufacturer} className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="form-checkbox text-steel-blue h-4 w-4 rounded border-gray-300 focus:ring-steel-blue"
            />
            <span className="ml-3 text-sm text-gray-700 group-hover:text-steel-blue transition-colors">
              {manufacturer}
            </span>
          </label>
        ))}
        {manufacturers.length === 0 && <p className="text-sm text-gray-500 italic">No manufacturers found</p>}
      </div>
      {manufacturers.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-steel-blue text-sm hover:underline mt-4 font-medium"
        >
          {showAll ? "Show less" : `Show ${manufacturers.length - 8} more manufacturers`}
        </button>
      )}
    </div>
  )
}

export default ManufacturerFilter
