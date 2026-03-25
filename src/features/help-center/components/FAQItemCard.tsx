import { ChevronDown } from "lucide-react"

import type { FaqItem } from "@/features/help-center/data/faqItems"

interface FAQItemCardProps {
  item: FaqItem
}

const FAQItemCard = ({ item }: FAQItemCardProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <details className="group">
        <summary className="flex list-none items-start justify-between cursor-pointer w-full text-left">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-steel-blue">{item.question}</h3>
          </div>
          <ChevronDown className="text-gray-400 ml-4 w-5 h-5 shrink-0 transition-transform duration-300 ease-in-out group-open:rotate-180" />
        </summary>
        <div className="grid transition-[grid-template-rows] duration-300 ease-in-out [grid-template-rows:0fr] group-open:[grid-template-rows:1fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="text-gray-600 pt-4">{item.answer}</div>
          </div>
        </div>
      </details>
    </div>
  )
}

export default FAQItemCard
