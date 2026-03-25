import type { LegalPaymentOption } from "@/features/legal/types"

interface SectionPaymentOptionsProps {
  options: LegalPaymentOption[]
}

export default function SectionPaymentOptionsBlock({ options }: SectionPaymentOptionsProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => (
          <div key={option.title}>
            <h4 className="font-semibold text-green-800 mb-3">{option.title}</h4>
            <ul className="text-sm text-green-700 space-y-1">
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
