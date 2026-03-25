import type { LegalPricingItem } from "@/features/legal/types"

interface SectionPricingProps {
  pricing: LegalPricingItem[]
}

export default function SectionPricingBlock({ pricing }: SectionPricingProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricing.map((price) => (
          <div key={price.label} className="text-center">
            <div className="text-3xl font-bold text-steel-blue mb-2">{price.value}</div>
            <div className="text-sm text-gray-700">{price.label}</div>
            <div className="text-xs text-gray-500 mt-1">{price.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
