import type { LegalPaymentOption } from "@/features/legal/types"

interface SectionPaymentOptionsProps {
  options: LegalPaymentOption[]
}

export default function SectionPaymentOptionsBlock({ options }: SectionPaymentOptionsProps) {
  return (
    <div className="mb-6 rounded-2xl border border-success/25 bg-success/10 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {options.map((option) => (
          <div key={option.title}>
            <h4 className="mb-3 font-semibold text-text-primary">{option.title}</h4>
            <ul className="space-y-1 text-sm text-text-secondary">
              {option.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
