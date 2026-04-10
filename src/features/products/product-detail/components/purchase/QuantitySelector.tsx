import { Minus, Plus } from "lucide-react"
import { useId } from "react"
import { Input } from "@/components/ui/input"

interface QuantitySelectorProps {
  quantity: number
  stockCount: number
  onQuantityChange: (value: number) => void
  onIncrement: () => void
  onDecrement: () => void
}

const QuantitySelector = ({
  quantity,
  stockCount,
  onQuantityChange,
  onIncrement,
  onDecrement,
}: QuantitySelectorProps) => {
  const inputId = useId()

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-text-primary">
        Quantity
      </label>
      <div className="flex items-center space-x-4">
        <div className="flex items-center rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
          <button
            type="button"
            onClick={onDecrement}
            className="px-4 py-2 text-text-secondary transition-colors hover:text-brand disabled:opacity-30"
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <Input
            id={inputId}
            type="number"
            value={quantity}
            min={1}
            max={stockCount || 1}
            onChange={(event) => onQuantityChange(Number.parseInt(event.target.value, 10) || 1)}
            className="h-10 w-20 border-x border-y-0 border-border-soft bg-transparent px-4 py-2 text-center shadow-none focus-visible:border-transparent focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={onIncrement}
            className="px-4 py-2 text-text-secondary transition-colors hover:text-brand disabled:opacity-30"
            disabled={quantity >= stockCount}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <span className="text-text-secondary">Units available: {stockCount}</span>
      </div>
    </div>
  )
}

export default QuantitySelector
