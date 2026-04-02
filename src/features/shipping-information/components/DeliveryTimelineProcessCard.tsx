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
    <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 sm:p-8">
      <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-6">Standard Processing Timeline</h3>
      <div className="space-y-6">
        {TIMELINE_STEPS.map((step) => (
          <div key={step.step} className="flex items-start">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${
                step.isLast ? "bg-pale-lime" : "bg-steel-blue"
              }`}
            >
              {step.isLast ? (
                <Check className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <span className="text-white font-bold text-sm sm:text-base">{step.step}</span>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{step.title}</h4>
              <p className="text-sm sm:text-base text-gray-600">{step.description}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{step.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
