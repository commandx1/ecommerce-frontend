import { ChevronDown } from "lucide-react"

interface ShippingFAQItemProps {
  answer: string
  question: string
}

export default function ShippingFAQItem({ answer, question }: ShippingFAQItemProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-soft bg-surface-elevated">
      <details className="group">
        <summary className="w-full cursor-pointer list-none p-4 text-left focus:outline-none sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="pr-4 text-base font-semibold text-text-primary sm:text-lg">{question}</h3>
            <ChevronDown className="shrink-0 text-text-muted transition-transform duration-300 ease-in-out group-open:rotate-180" />
          </div>
        </summary>
        <div className="px-4 pb-4 text-sm text-text-secondary sm:px-6 sm:pb-6 sm:text-base">
          <p>{answer}</p>
        </div>
      </details>
    </div>
  )
}
