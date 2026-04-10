import { ChevronDown } from "lucide-react"

import type { FaqItem } from "@/features/help-center/data/faqItems"

interface FAQItemCardProps {
  item: FaqItem
}

const FAQItemCard = ({ item }: FAQItemCardProps) => {
  return (
    <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 shadow-soft">
      <details className="group">
        <summary className="flex list-none items-start justify-between cursor-pointer w-full text-left">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text-primary">{item.question}</h3>
          </div>
          <ChevronDown className="ml-4 h-5 w-5 shrink-0 text-text-muted transition-transform duration-300 ease-in-out group-open:rotate-180" />
        </summary>
        <div className="grid transition-[grid-template-rows] duration-300 ease-in-out [grid-template-rows:0fr] group-open:[grid-template-rows:1fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="pt-4 text-text-secondary">{item.answer}</div>
          </div>
        </div>
      </details>
    </div>
  )
}

export default FAQItemCard
