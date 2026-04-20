interface FinalReviewPaymentSummaryProps {
  paymentMethodSummary: string
}

export default function FinalReviewPaymentSummary({ paymentMethodSummary }: FinalReviewPaymentSummaryProps) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Payment Method</h3>
      <div className="text-sm text-text-secondary">
        <div className="font-medium text-text-primary">Credit/Debit Card</div>
        <div className="mt-1">{paymentMethodSummary || "Card details entered in Billing step"}</div>
      </div>
    </div>
  )
}
