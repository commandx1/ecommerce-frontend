import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"

const PRICE_OPTIONS = [
  { label: "Under $50", range: "0-50", count: 234 },
  { label: "$50 - $200", range: "50-200", count: 567 },
  { label: "$200 - $500", range: "200-500", count: 345 },
  { label: "$500 - $1,000", range: "500-1000", count: 123 },
  { label: "Over $1,000", range: "1000+", count: 89 },
]

const PriceRangeFilter = () => {
  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Price Range</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="block text-xs text-gray-500 mb-1">Min</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <Input type="number" placeholder="0" className="w-full pl-7 pr-3 py-2 border-gray-300 text-sm" />
            </div>
          </div>
          <div>
            <Label className="block text-xs text-gray-500 mb-1">Max</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <Input type="number" placeholder="1000" className="w-full pl-7 pr-3 py-2 border-gray-300 text-sm" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {PRICE_OPTIONS.map((option) => (
            <div key={option.range} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio id={`price-${option.range}`} name="priceRange" />
                <Label htmlFor={`price-${option.range}`} className="text-sm text-gray-700">
                  {option.label}
                </Label>
              </div>
              <span className="text-xs text-gray-500">({option.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PriceRangeFilter
