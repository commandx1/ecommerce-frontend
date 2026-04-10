import { CheckCircle } from "lucide-react"

export default function OrderConfirmationHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <CheckCircle className="h-12 w-12 text-success" />
      </div>
      <h2 className="mb-2 text-3xl font-bold text-text-primary">Order Confirmed!</h2>
      <p className="text-lg text-text-secondary">
        Thank you for your order. We&apos;ve received your order and will begin processing it right away.
      </p>
    </div>
  )
}
