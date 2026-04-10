import type { LegalSecurityStandard } from "@/features/legal/types"

interface SectionSecurityStandardsProps {
  standards: LegalSecurityStandard[]
}

export default function SectionSecurityStandardsBlock({ standards }: SectionSecurityStandardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
      {standards.map((standard) => (
        <div key={standard.title} className="rounded-[1.35rem] border border-border-soft bg-surface-muted/70 p-6">
          <h4 className="mb-4 font-semibold text-text-primary">{standard.title}</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            {standard.items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
