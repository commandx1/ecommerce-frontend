import { Receipt, Truck, Weight } from "lucide-react"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartItemPriceProps {
  oldPrice: number
  price: number
  discount: number
  quantity: number
  shipmentFee: number
  heavyShippingSurcharge: number
}

interface FeeRowProps {
  icon: React.ElementType
  label: string
  amount: number
  emphasis?: boolean
}

function FeeRow({ icon: Icon, label, amount, emphasis }: FeeRowProps) {
  const isFree = amount === 0

  return (
    <div
      className={`flex items-center justify-between gap-3 ${emphasis ? "text-[11px] font-semibold" : "text-[11px]"}`}
    >
      <span className="inline-flex items-center gap-1.5 text-text-muted">
        <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} />
        {label}
      </span>
      <span
        className={`font-mono tabular-nums ${
          isFree ? "text-success" : emphasis ? "text-brand" : "text-text-secondary"
        }`}
      >
        {isFree ? "Free" : formatCurrency(amount)}
      </span>
    </div>
  )
}

export default function CartItemPrice({
  oldPrice,
  price,
  discount,
  quantity,
  shipmentFee,
  heavyShippingSurcharge,
}: CartItemPriceProps) {
  const shipmentFeeTotal = shipmentFee * quantity
  const heavyShipmentFeeTotal = heavyShippingSurcharge * quantity
  const totalShipmentFee = shipmentFeeTotal + heavyShipmentFeeTotal
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

      <div className="mt-2 min-w-[9.75rem] space-y-1.5 rounded-xl border border-border-soft/70 bg-surface-muted/60 px-2.5 py-2">
        <FeeRow icon={Truck} label="Shipment" amount={shipmentFeeTotal} />
        <FeeRow icon={Weight} label="Heavy fee" amount={heavyShipmentFeeTotal} />
        <div className="border-t border-border-soft/70 pt-1.5">
          <FeeRow icon={Receipt} label="Total" amount={totalShipmentFee} emphasis />
        </div>
      </div>
    </div>
  )
}
