import {
  Award,
  ClipboardList,
  Cookie,
  Database,
  FileText,
  Gavel,
  Handshake,
  Info,
  type LucideIcon,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react"
import Link from "next/link"

import legalDocumentsData from "@/data/legal-documents.json"

const iconMap: Record<string, LucideIcon> = {
  "file-contract": FileText,
  "shield-check": ShieldCheck,
  "user-md": User,
  handshake: Handshake,
  "shopping-bag": ShoppingBag,
  database: Database,
  "cookie-bite": Cookie,
  gavel: Gavel,
  certificate: Award,
  "clipboard-list": ClipboardList,
}

interface LegalSidebarProps {
  selectedId: string
}

const LegalSidebar = ({ selectedId }: LegalSidebarProps) => {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-12 rounded-[1.5rem] border border-border-soft bg-surface-elevated p-6 shadow-soft">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">Document Categories</h3>
        <nav className="space-y-2">
          {legalDocumentsData.sidebarNav.map((item) => {
            const IconComponent = iconMap[item.icon]
            const isActive = selectedId === item.id
            return (
              <Link
                key={item.id}
                href={`/legal?doc=${item.id}`}
                scroll={false}
                className={`group flex w-full items-center rounded-xl px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "bg-accent text-brand font-medium"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {IconComponent && <IconComponent className="mr-3 h-5 w-5 shrink-0 text-brand" />}
                <span className={isActive ? "text-brand" : "group-hover:text-text-primary"}>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 rounded-xl border border-border-soft bg-surface-muted/80 p-4">
          <div className="mb-3 flex items-center">
            <Info className="mr-2 h-5 w-5 text-brand" />
            <span className="font-semibold text-text-primary">Need Help?</span>
          </div>
          <p className="mb-3 text-sm text-text-secondary">
            Contact our legal team for questions about compliance or document interpretation.
          </p>
          <a
            href="/help-center"
            className="block w-full rounded-full bg-brand px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
          >
            Contact Legal Team
          </a>
        </div>
      </div>
    </div>
  )
}

export default LegalSidebar
