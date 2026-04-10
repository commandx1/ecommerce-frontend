import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartItemPriceProps {
  oldPrice: number
  price: number
}

export default function CartItemPrice({ oldPrice, price }: CartItemPriceProps) {
  return (
    <div className="text-right">
      <span className="block font-semibold text-brand">{formatCurrency(price)}</span>
      {oldPrice > price ? (
        <span className="block text-xs text-text-muted line-through">{formatCurrency(oldPrice)}</span>
      ) : null}
    </div>
  )
}
