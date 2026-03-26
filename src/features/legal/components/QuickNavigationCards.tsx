import { FileText, Gavel, type LucideIcon, ShieldCheck, User2 } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

import legalDocumentsData from "@/data/legal-documents.json"

const iconMap: Record<string, LucideIcon> = {
  "file-contract": FileText,
  "shield-check": ShieldCheck,
  "user-md": User2,
  gavel: Gavel,
}

interface QuickNavigationCardsProps {
  selectedId: string
}

const QuickNavigationCards = ({ selectedId }: QuickNavigationCardsProps) => {
  return (
    <PageSectionContainer as="section" className="pt-12 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {legalDocumentsData.quickNav.map((item) => {
          const IconComponent = iconMap[item.icon]
          const isActive = selectedId === item.id
          return (
            <Link
              key={item.id}
              href={`/legal?doc=${item.id}`}
              scroll={false}
              className={`rounded-2xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group ${
                isActive ? "bg-steel-blue text-white" : "bg-light-mint-gray"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${
                  isActive ? "bg-pale-lime" : "bg-steel-blue"
                }`}
              >
                {IconComponent && (
                  <IconComponent className={`w-8 h-8 ${isActive ? "text-steel-blue" : "text-white"}`} />
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isActive ? "text-white" : "text-steel-blue"}`}>
                {item.title}
              </h3>
              <p className={`text-sm ${isActive ? "text-blue-100" : "text-gray-600"}`}>{item.description}</p>
            </Link>
          )
        })}
      </div>
    </PageSectionContainer>
  )
}

export default QuickNavigationCards
