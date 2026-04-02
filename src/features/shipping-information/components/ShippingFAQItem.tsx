import { ChevronDown } from "lucide-react"

interface ShippingFAQItemProps {
  answer: string
  question: string
}

export default function ShippingFAQItem({ answer, question }: ShippingFAQItemProps) {
  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      <details className="group">
        <summary className="w-full list-none text-left p-4 sm:p-6 focus:outline-none cursor-pointer">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-steel-blue pr-4">{question}</h3>
            <ChevronDown className="text-gray-400 shrink-0 transition-transform duration-300 ease-in-out group-open:rotate-180" />
          </div>
        </summary>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base text-gray-600">
          <p>{answer}</p>
        </div>
      </details>
    </div>
  )
}
