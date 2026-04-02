import { Shield } from "lucide-react"

const INSURANCE_BLOCKS = [
  {
    title: "Standard Coverage",
    main: "All shipments include basic carrier insurance up to $100 at no additional cost",
    note: "Covers loss or damage during transit",
  },
  {
    title: "Additional Insurance",
    main: "Optional enhanced coverage available for high-value orders during checkout",
    note: "Recommended for equipment and bulk orders over $1,000",
  },
  {
    title: "Signature Requirements",
    main: "Orders over $500 require signature upon delivery for security",
    note: "Ensures proper handoff and proof of delivery",
  },
] as const

export default function InsuranceLiabilityCard() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-coral-orange rounded-xl flex items-center justify-center mr-4">
          <Shield className="text-white w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Insurance & Liability</h3>
      </div>
      <div className="space-y-4">
        {INSURANCE_BLOCKS.map((item) => (
          <div key={item.title} className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{item.title}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.main}</p>
            <div className="text-xs text-gray-500">{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
