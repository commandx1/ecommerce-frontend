import { X } from "lucide-react"

const ActiveFilters = () => {
  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Active Filters</h3>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-steel-blue text-white">
          In Stock
          <button type="button" className="ml-2 text-white/80 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>
  )
}

export default ActiveFilters
