import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartItemPriceProps {
  oldPrice: number
  price: number
}

export default function CartItemPrice({ oldPrice, price }: CartItemPriceProps) {
  return (
    <div className="text-right">
      <span className="block font-semibold text-steel-blue">{formatCurrency(price)}</span>
      {oldPrice > price ? (
        <span className="block text-xs text-gray-400 line-through">{formatCurrency(oldPrice)}</span>
      ) : null}
    </div>
  )
}
