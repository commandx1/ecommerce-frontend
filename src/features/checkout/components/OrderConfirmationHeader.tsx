import { CheckCircle } from "lucide-react"

export default function OrderConfirmationHeader() {
  return (
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-steel-blue mb-2">Order Confirmed!</h2>
      <p className="text-lg text-gray-600">
        Thank you for your order. We&apos;ve received your order and will begin processing it right away.
      </p>
    </div>
  )
}
