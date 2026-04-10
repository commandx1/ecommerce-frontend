import { Check } from "lucide-react"

interface TIMELINE_STEP_ITEM {
  step: number
  title: string
  description: string
  note: string
  isLast?: boolean
}

const TIMELINE_STEPS = [
  {
    step: 1,
    title: "Order Received",
    description: "Confirmation sent immediately upon order placement",
    note: "Within minutes",
  },
  {
    step: 2,
    title: "Order Processing",
    description: "Verification, picking, and professional packaging",
    note: "1–2 business days",
  },
  {
    step: 3,
    title: "Shipment Dispatch",
    description: "Handed to carrier with tracking information",
    note: "After processing complete",
  },
  {
    step: 4,
    title: "Delivery Complete",
    description: "Arrival at your practice or facility",
    note: "Based on shipping method",
    isLast: true,
  },
] as TIMELINE_STEP_ITEM[]

export default function DeliveryTimelineProcessCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-muted/55 p-6 sm:rounded-2xl sm:p-8">
      <h3 className="mb-6 text-xl font-bold text-text-primary sm:text-2xl">Standard Processing Timeline</h3>
      <div className="space-y-6">
        {TIMELINE_STEPS.map((step) => (
          <div key={step.step} className="flex items-start">
            <div
              className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${
                step.isLast ? "bg-accent-strong/30" : "bg-brand"
              }`}
            >
              {step.isLast ? (
                <Check className="h-5 w-5 text-brand sm:h-6 sm:w-6" />
              ) : (
                <span className="text-sm font-bold text-inverse-foreground sm:text-base">{step.step}</span>
              )}
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold text-text-primary sm:text-base">{step.title}</h4>
              <p className="text-sm text-text-secondary sm:text-base">{step.description}</p>
              <p className="mt-1 text-xs text-text-muted sm:text-sm">{step.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
