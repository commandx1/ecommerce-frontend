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
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-surface-elevated text-text-primary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={decreaseLabel}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-sm font-medium text-text-primary">{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-surface-elevated text-text-primary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={increaseLabel}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
