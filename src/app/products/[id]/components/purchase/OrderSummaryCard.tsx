import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderSummary {
  product: string
}

interface OrderSummaryCardProps {
  orderSummary: OrderSummary
  quantity: number
  unitPrice: number
  productTotal: number
  warrantyPrice: number
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
  warrantyPrice,
  shippingPrice,
  subtotal,
  tax,
  total,
}: OrderSummaryCardProps) => {
  return (
    <div className="bg-white rounded-xl p-6 h-fit">
      <h3 className="text-xl font-semibold text-steel-blue mb-4">Order Summary</h3>
      <div className="space-y-3">
        <div className="space-y-2 border-b border-gray-100 pb-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Unit Price</span>
            <span className="font-medium text-gray-900">{formatCurrency(unitPrice)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-gray-600">
              {orderSummary.product}{" "}
              <span className="whitespace-nowrap font-medium text-gray-400 text-sm">x {quantity}</span>
            </span>
            <span className="font-bold text-steel-blue">{formatCurrency(productTotal)}</span>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Extended Warranty</span>
          <span className="font-semibold">{formatCurrency(warrantyPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="text-green-600 font-semibold">{shippingPrice === 0 ? "Free" : formatCurrency(shippingPrice)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (Est.)</span>
            <span className="font-semibold">{formatCurrency(tax)}</span>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-xl font-bold text-steel-blue">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSummaryCard
