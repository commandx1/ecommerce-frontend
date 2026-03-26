import { Minus, Plus } from "lucide-react"

interface QuantityStepperProps {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel?: string
  increaseLabel?: string
  disabled?: boolean
}

export default function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel = "Decrease quantity",
  increaseLabel = "Increase quantity",
  disabled = false,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={decreaseLabel}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={increaseLabel}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
