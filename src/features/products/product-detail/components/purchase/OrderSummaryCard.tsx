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
        <div className="flex justify-between">
          <span className="text-text-secondary">Shipping</span>
          <span className="font-semibold text-success">
            {shippingPrice === 0 ? "Free" : formatCurrency(shippingPrice)}
          </span>
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
