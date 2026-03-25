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
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
      <h3 className="text-lg sm:text-xl font-bold text-steel-blue mb-4">Special Pricing Notes</h3>
      <div className="space-y-3">
        {PRICING_NOTES.map((note) => (
          <div key={note.title} className="border-l-4 border-steel-blue pl-4">
            <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{note.title}</h4>
            <p className="text-xs sm:text-sm text-gray-600">{note.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
