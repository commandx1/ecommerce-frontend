import { Minus, Plus } from "lucide-react"

interface CartItemQuantityControlProps {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
}

export default function CartItemQuantityControl({ quantity, onDecrease, onIncrease }: CartItemQuantityControlProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={onDecrease}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium w-8 text-center">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
