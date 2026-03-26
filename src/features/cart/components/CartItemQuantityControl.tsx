import QuantityStepper from "@/components/ui/QuantityStepper"

interface CartItemQuantityControlProps {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
}

export default function CartItemQuantityControl({ quantity, onDecrease, onIncrease }: CartItemQuantityControlProps) {
  return <QuantityStepper value={quantity} onDecrease={onDecrease} onIncrease={onIncrease} />
}
