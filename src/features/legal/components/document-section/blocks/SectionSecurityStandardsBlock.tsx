import type { LegalSecurityStandard } from "@/features/legal/types"

interface SectionSecurityStandardsProps {
  standards: LegalSecurityStandard[]
}

export default function SectionSecurityStandardsBlock({ standards }: SectionSecurityStandardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {standards.map((standard) => (
        <div key={standard.title} className="bg-gray-50 p-6 rounded-xl">
          <h4 className="font-semibold text-steel-blue mb-4">{standard.title}</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            {standard.items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
