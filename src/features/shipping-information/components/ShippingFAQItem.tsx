import { ChevronDown } from "lucide-react"

interface ShippingFAQItemProps {
  answer: string
  id: string
  isOpen: boolean
  question: string
  onToggle: (id: string) => void
}

export default function ShippingFAQItem({ answer, id, isOpen, question, onToggle }: ShippingFAQItemProps) {
  return (
    <div className="bg-light-mint-gray rounded-xl overflow-hidden">
      <button type="button" onClick={() => onToggle(id)} className="w-full text-left p-4 sm:p-6 focus:outline-none">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-steel-blue pr-4">{question}</h3>
          <ChevronDown
            className={`text-gray-400 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base text-gray-600">
            <p>{answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
