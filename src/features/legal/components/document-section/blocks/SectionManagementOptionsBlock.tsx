import type { LegalManagementOption } from "@/features/legal/types"

interface SectionManagementOptionsProps {
  options: LegalManagementOption[]
}

export default function SectionManagementOptionsBlock({ options }: SectionManagementOptionsProps) {
  return (
    <div className="mb-6 rounded-2xl border border-warning/25 bg-warning/10 p-6">
      <h4 className="mb-3 font-semibold text-text-primary">Managing Your Cookie Preferences</h4>
      <p className="mb-4 text-sm text-text-secondary">
        You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact
        your user experience.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map((option) => (
          <div key={option.title} className="rounded-xl border border-border-soft bg-surface-elevated p-4">
            <h5 className="mb-2 font-semibold text-text-primary">{option.title}</h5>
            <p className="text-xs text-text-secondary">{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
