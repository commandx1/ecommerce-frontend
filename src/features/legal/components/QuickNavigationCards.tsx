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
    <PageSectionContainer as="section" className="bg-canvas pt-12">
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
        {legalDocumentsData.quickNav.map((item) => {
          const IconComponent = iconMap[item.icon]
          const isActive = selectedId === item.id
          return (
            <Link
              key={item.id}
              href={`/legal?doc=${item.id}`}
              scroll={false}
              className={`group cursor-pointer rounded-[1.5rem] border p-6 text-center transition-shadow ${
                isActive
                  ? "border-brand bg-brand text-inverse-foreground shadow-panel dark:bg-brand-surface"
                  : "border-border-soft bg-surface-elevated hover:shadow-soft"
              }`}
            >
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${
                  isActive ? "bg-accent-strong text-accent-foreground" : "bg-brand text-primary-foreground"
                }`}
              >
                {IconComponent && <IconComponent className="h-8 w-8" />}
              </div>
              <h3
                className={`mb-2 text-lg font-semibold ${isActive ? "text-inverse-foreground" : "text-text-primary"}`}
              >
                {item.title}
              </h3>
              <p className={`text-sm ${isActive ? "text-inverse-muted" : "text-text-secondary"}`}>{item.description}</p>
            </Link>
          )
        })}
      </div>
    </PageSectionContainer>
  )
}

export default QuickNavigationCards
