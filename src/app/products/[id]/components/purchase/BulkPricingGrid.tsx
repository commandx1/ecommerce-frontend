interface BulkPricingOption {
  id: number
  range: string
  price: string
  note: string
  selected: boolean
}

interface BulkPricingGridProps {
  options: BulkPricingOption[]
  activeOptionId?: number
}

const BulkPricingGrid = ({ options, activeOptionId }: BulkPricingGridProps) => {
  return (
    <div>
      <div className="block text-sm font-medium text-gray-700 mb-3">Bulk Pricing</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <div
            key={option.id}
            className={`bg-white border rounded-lg p-4 transition-colors text-left ${
              activeOptionId === option.id
                ? "border-2 border-steel-blue ring-1 ring-steel-blue"
                : "border-gray-200 opacity-60"
            }`}
          >
            <div className="text-center">
              <div className="font-semibold text-steel-blue">{option.range}</div>
              <div className="text-2xl font-bold text-gray-900">{option.price}</div>
              <div
                className={`text-sm ${option.note.includes("Save") ? "text-green-600 font-medium" : "text-gray-600"}`}
              >
                {option.note}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BulkPricingGrid
