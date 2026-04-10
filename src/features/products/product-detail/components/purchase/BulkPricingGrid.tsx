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
      <div className="mb-3 block text-sm font-medium text-text-primary">Bulk Pricing</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {options.map((option) => (
          <div
            key={option.id}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              activeOptionId === option.id
                ? "border-brand bg-accent/70 shadow-soft ring-1 ring-brand/15"
                : "border-border-soft bg-surface-elevated"
            }`}
          >
            <div className="text-center">
              <div className="font-semibold text-brand">{option.range}</div>
              <div className="text-2xl font-bold text-text-primary">{option.price}</div>
              <div
                className={`text-sm ${option.note.includes("Save") ? "font-medium text-success" : "text-text-secondary"}`}
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
