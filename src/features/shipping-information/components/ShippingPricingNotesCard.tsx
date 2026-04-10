const PRICING_NOTES = [
  {
    title: "Same-Day Premium",
    description: "Uber Direct pricing reflects urgent delivery service and local courier costs",
  },
  {
    title: "International Duties",
    description: "Customs fees, duties, and taxes are customer responsibility unless otherwise stated",
  },
  {
    title: "Bulk Discounts",
    description: "Large orders may qualify for negotiated freight rates—contact sales team",
  },
] as const

export default function ShippingPricingNotesCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8">
      <h3 className="mb-4 text-lg font-bold text-text-primary sm:text-xl">Special Pricing Notes</h3>
      <div className="space-y-3">
        {PRICING_NOTES.map((note) => (
          <div key={note.title} className="border-l-4 border-brand pl-4">
            <h4 className="mb-1 text-sm font-semibold text-text-primary sm:text-base">{note.title}</h4>
            <p className="text-xs text-text-secondary sm:text-sm">{note.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
