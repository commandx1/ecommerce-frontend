import { Minus, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"

interface QuantitySelectorProps {
  quantity: number
  stockCount: number
  onQuantityChange: (value: number) => void
  onIncrement: () => void
  onDecrement: () => void
}

const QuantitySelector = ({ quantity, stockCount, onQuantityChange, onIncrement, onDecrement }: QuantitySelectorProps) => {
  return (
    <div>
      <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-2">
        Quantity
      </label>
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            type="button"
            onClick={onDecrement}
            className="px-4 py-2 text-gray-600 hover:text-steel-blue transition-colors disabled:opacity-30"
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <Input
            id="quantity-input"
            type="number"
            value={quantity}
            min={1}
            max={stockCount || 1}
            onChange={(event) => onQuantityChange(Number.parseInt(event.target.value, 10) || 1)}
            className="h-10 w-20 px-4 py-2 text-center bg-white border-0 focus-visible:ring-2 focus-visible:ring-steel-blue"
          />
          <button
            type="button"
            onClick={onIncrement}
            className="px-4 py-2 text-gray-600 hover:text-steel-blue transition-colors disabled:opacity-30"
            disabled={quantity >= stockCount}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <span className="text-gray-600">Units available: {stockCount}</span>
      </div>
    </div>
  )
}

export default QuantitySelector
