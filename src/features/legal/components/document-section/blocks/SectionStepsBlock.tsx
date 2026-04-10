import type { LegalStepItem } from "@/features/legal/types"

interface SectionStepsProps {
  steps: LegalStepItem[]
}

export default function SectionStepsBlock({ steps }: SectionStepsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
      {steps.map((step) => (
        <div
          key={step.title}
          className="rounded-[1.2rem] border border-border-soft bg-surface-muted/70 p-4 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-primary-foreground">
            <span className="font-bold">{step.step}</span>
          </div>
          <h4 className="mb-2 font-semibold text-text-primary">{step.title}</h4>
          <p className="text-sm text-text-secondary">{step.description}</p>
        </div>
      ))}
    </div>
  )
}
