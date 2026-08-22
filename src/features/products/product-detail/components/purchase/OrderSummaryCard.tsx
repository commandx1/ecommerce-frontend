import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderSummary {
  product: string
}

interface OrderSummaryCardProps {
  orderSummary: OrderSummary
  quantity: number
  unitPrice: number
  productTotal: number
  warrantyPrice?: number
  shippingFeePrice: number
  heavyShippingFeePrice: number
  shippingPrice: number
  subtotal: number
  tax: number
  total: number
}

const OrderSummaryCard = ({
  orderSummary,
  quantity,
  unitPrice,
  productTotal,
  //warrantyPrice,
  shippingFeePrice,
  heavyShippingFeePrice,
  shippingPrice,
  subtotal,
  tax,
  total,
}: OrderSummaryCardProps) => {
  return (
    <div className="h-fit rounded-3xl border border-border-soft bg-surface p-6 shadow-soft">
      <h3 className="mb-4 text-xl font-semibold text-text-primary">Order Summary</h3>
      <div className="space-y-3">
        <div className="space-y-2 border-b border-border-soft pb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Unit Price</span>
            <span className="font-medium text-text-primary">{formatCurrency(unitPrice)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-text-secondary">
              {orderSummary.product}{" "}
              <span className="whitespace-nowrap text-sm font-medium text-text-muted">x {quantity}</span>
            </span>
            <span className="font-bold text-brand">{formatCurrency(productTotal)}</span>
          </div>
        </div>
        {/* <div className="flex justify-between">
          <span className="text-text-secondary">Extended Warranty</span>
          <span className="font-semibold">{formatCurrency(warrantyPrice)}</span>
        </div> */}
        <div className="space-y-1.5 rounded-2xl bg-surface-muted/60 px-3 py-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Shipping</span>
            <span className="font-medium text-text-primary">
              {shippingFeePrice === 0 ? "Free" : formatCurrency(shippingFeePrice)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Heavy shipping surcharge</span>
            <span className="font-medium text-text-primary">
              {heavyShippingFeePrice === 0 ? "Free" : formatCurrency(heavyShippingFeePrice)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border-soft pt-1.5">
            <span className="font-medium text-text-secondary">Total shipping</span>
            <span className="font-semibold text-success">
              {shippingPrice === 0 ? "Free" : formatCurrency(shippingPrice)}
            </span>
          </div>
        </div>
        <div className="border-t border-border-soft pt-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Tax (Est.)</span>
            <span className="font-semibold">{formatCurrency(tax)}</span>
          </div>
        </div>
        <div className="border-t border-border-soft pt-3">
          <div className="flex justify-between text-xl font-bold text-brand">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSummaryCard
