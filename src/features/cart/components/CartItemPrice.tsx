import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartItemPriceProps {
  oldPrice: number
  price: number
  discount: number
  quantity: number
  shipmentFee: number
}

export default function CartItemPrice({ oldPrice, price, discount, quantity, shipmentFee }: CartItemPriceProps) {
  const shippingTotal = shipmentFee * quantity
  const formattedDiscount = Number.isInteger(discount) ? `${discount}` : discount.toFixed(1)

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-2">
        {discount > 0 ? <span className="text-xs text-text-muted line-through">{formatCurrency(oldPrice)}</span> : null}
        {discount > 0 ? (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
            -{formattedDiscount}%
          </span>
        ) : null}
        <span className="font-semibold text-brand">{formatCurrency(price)}</span>
      </div>
      <span className="mt-1 block text-xs text-text-secondary">
        Shipping: {shippingTotal === 0 ? "Free" : formatCurrency(shippingTotal)}
      </span>
    </div>
  )
}
