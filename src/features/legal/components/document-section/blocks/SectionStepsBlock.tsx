import type { LegalStepItem } from "@/features/legal/types"

interface SectionStepsProps {
  steps: LegalStepItem[]
}

export default function SectionStepsBlock({ steps }: SectionStepsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {steps.map((step) => (
        <div key={step.title} className="text-center bg-gray-50 p-4 rounded-xl">
          <div className="w-12 h-12 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold">{step.step}</span>
          </div>
          <h4 className="font-semibold text-steel-blue mb-2">{step.title}</h4>
          <p className="text-sm text-gray-600">{step.description}</p>
        </div>
      ))}
    </div>
  )
}
