"use client"

import { FileText, Gavel, type LucideIcon, ShieldCheck, User2 } from "lucide-react"
import legalDocumentsData from "@/data/legal-documents.json"

const iconMap: Record<string, LucideIcon> = {
  "file-contract": FileText,
  "shield-check": ShieldCheck,
  "user-md": User2,
  gavel: Gavel,
}

const QuickNavigationCards = () => {
  const handleCardClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <section id="quick-navigation" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {legalDocumentsData.quickNav.map((item) => {
            const IconComponent = iconMap[item.icon]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCardClick(item.id)}
                className="bg-light-mint-gray rounded-2xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {IconComponent && <IconComponent className="text-white w-8 h-8" />}
                </div>
                <h3 className="text-lg font-semibold text-steel-blue mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default QuickNavigationCards
