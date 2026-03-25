import type { LegalManagementOption } from "@/features/legal/types"

interface SectionManagementOptionsProps {
  options: LegalManagementOption[]
}

export default function SectionManagementOptionsBlock({ options }: SectionManagementOptionsProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h4 className="font-semibold text-yellow-800 mb-3">Managing Your Cookie Preferences</h4>
      <p className="text-yellow-700 text-sm mb-4">
        You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact
        your user experience.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <div key={option.title} className="bg-white p-4 rounded-lg">
            <h5 className="font-semibold text-steel-blue mb-2">{option.title}</h5>
            <p className="text-xs text-gray-600">{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
