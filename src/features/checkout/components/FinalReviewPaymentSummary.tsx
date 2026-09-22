import CardBrandIcon from "@/components/payments/CardBrandIcon"

interface FinalReviewPaymentSummaryProps {
  paymentMethodSummary: string
}

export default function FinalReviewPaymentSummary({ paymentMethodSummary }: FinalReviewPaymentSummaryProps) {
  // The summary is always built as `${BRAND} •••• ${last4}` by useBillingInformation, so the first
  // word is the Stripe brand key; anything else ("Saved card", "New card") falls back to the
  // generic icon inside CardBrandIcon.
  const brand = paymentMethodSummary.split(" ")[0]

  return (
    <div className="rounded-xl border border-border-soft bg-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Payment Method</h3>
      <div className="flex items-center gap-4">
        <CardBrandIcon brand={brand} />
        <div className="min-w-0 text-sm text-text-secondary">
          <div className="font-medium text-text-primary">Credit/Debit Card</div>
          <div className="mt-0.5 truncate">{paymentMethodSummary || "Card details entered in Billing step"}</div>
        </div>
      </div>
    </div>
  )
}
