"use client"

import { AlertCircle, CheckCircle } from "lucide-react"
import { useCheckoutStore } from "@/stores/checkoutStore"

export default function OrderConfirmationHeader() {
  const { orderResult } = useCheckoutStore()
  const normalizedStatus = orderResult?.paymentStatus?.toLowerCase() ?? ""
  const isPaymentFailed = normalizedStatus === "payment_failed" || normalizedStatus === "canceled"

  return (
    <div className="mb-8 text-center">
      {isPaymentFailed ? (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/15">
            <AlertCircle className="h-12 w-12 text-danger" />
          </div>
          <h2 className="mb-2 text-3xl font-bold text-text-primary">Payment Failed</h2>
          <p className="text-lg text-text-secondary">
            Your order was created, but the payment was canceled. Please update your payment method and try again.
          </p>
        </>
      ) : (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          <h2 className="mb-2 text-3xl font-bold text-text-primary">Order Confirmed!</h2>
          <p className="text-lg text-text-secondary">
            Thank you for your order. We&apos;ve received your order and will begin processing it right away.
          </p>
        </>
      )}
    </div>
  )
}
