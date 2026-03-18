"use client"

import { CheckCircle, ExternalLink, Home, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

const OrderConfirmation = () => {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const { reset, orderResult } = useCheckoutStore()

  const handleContinueShopping = () => {
    clearCart()
    reset()
    router.push("/")
  }

  const createdDate = orderResult ? new Date(orderResult.createdDate) : null

  return (
    <div className="bg-white rounded-2xl shadow-lg p-12 mb-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-steel-blue mb-2">Order Confirmed!</h2>
        <p className="text-lg text-gray-600">
          Thank you for your order. We&apos;ve received your order and will begin processing it right away.
        </p>
      </div>

      {orderResult && (
        <div className="grid gap-6 mb-10 lg:grid-cols-3">
          <div className="bg-light-mint-gray rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">Order ID</div>
            <div className="text-base font-mono break-all text-gray-900 mb-4">{orderResult.orderId}</div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Status</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  orderResult.status === "PAYMENT_SUCCESS"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {orderResult.status}
              </span>
            </div>
          </div>

          <div className="bg-light-mint-gray rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">Order Date</div>
            <div className="text-base font-semibold text-gray-900 mb-4">
              {createdDate ? createdDate.toLocaleString() : "-"}
            </div>
            <div className="text-sm text-gray-600 mb-2">Total Price</div>
            <div className="text-2xl font-bold text-steel-blue">{formatCurrency(orderResult.totalPrice)}</div>
          </div>

          <div className="bg-light-mint-gray rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">Items Count</div>
            <div className="text-2xl font-bold text-steel-blue mb-4">
              {orderResult.orderItems.reduce((acc, item) => acc + item.quantity, 0)}
            </div>
            <div className="text-xs text-gray-600">
              You will receive an email confirmation shortly with your order details and tracking information.
            </div>
          </div>
        </div>
      )}

      {orderResult && orderResult.orderItems.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xl font-semibold text-steel-blue mb-4">Order Items</h3>
          <div className="space-y-4">
            {orderResult.orderItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              >
                <div>
                  <div className="text-sm text-gray-500 mb-1">Item ID</div>
                  <div className="text-sm font-mono break-all text-gray-900 mb-2">{item.id}</div>
                  <div className="text-xs text-gray-500 mb-1">User Product ID</div>
                  <div className="text-xs font-mono break-all text-gray-700 mb-2">{item.userProductId}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-700 mt-2">
                    <span>
                      Qty: <span className="font-semibold">{item.quantity}</span>
                    </span>
                    <span>
                      Price: <span className="font-semibold">{formatCurrency(item.price)}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "WAITING_FOR_SHIPMENT"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  {item.trackingLink && item.trackingLink.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Tracking Links</div>
                      <div className="flex flex-wrap gap-2">
                        {item.trackingLink.map((link, index) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200"
                          >
                            Tracking Link {index + 1}
                            <ExternalLink className="w-4 h-4 ml-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/buyer-dashboard"
          className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          <Package className="mr-2 w-5 h-5" />
          View Orders
        </Link>
        <button
          type="button"
          onClick={handleContinueShopping}
          className="flex items-center justify-center px-6 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
        >
          <Home className="mr-2 w-5 h-5" />
          Continue Shopping
        </button>
      </div>
    </div>
  )
}

export default OrderConfirmation
