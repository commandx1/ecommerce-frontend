"use client"

import { ChevronDown } from "lucide-react"

import type { FaqItem } from "../data/faqItems"

interface FAQItemCardProps {
  item: FaqItem
  isOpen: boolean
  onToggle: (id: string) => void
}

const FAQItemCard = ({ item, isOpen, onToggle }: FAQItemCardProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className="flex items-start justify-between cursor-pointer w-full text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-steel-blue">{item.question}</h3>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="text-gray-600 pt-4">{item.answer}</div>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`text-gray-400 ml-4 w-5 h-5 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  )
}

export default FAQItemCard
