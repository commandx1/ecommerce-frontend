import type { LegalPricingItem } from "@/features/legal/types"

interface SectionPricingProps {
  pricing: LegalPricingItem[]
}

export default function SectionPricingBlock({ pricing }: SectionPricingProps) {
  return (
    <div className="mb-6 rounded-2xl border border-brand/20 bg-accent/70 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {pricing.map((price) => (
          <div key={price.label} className="text-center">
            <div className="mb-2 text-3xl font-bold text-brand">{price.value}</div>
            <div className="text-sm text-text-primary">{price.label}</div>
            <div className="mt-1 text-xs text-text-secondary">{price.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
