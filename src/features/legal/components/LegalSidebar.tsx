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
      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-12">
        <h3 className="text-lg font-semibold text-steel-blue mb-4">Document Categories</h3>
        <nav className="space-y-2">
          {legalDocumentsData.sidebarNav.map((item) => {
            const IconComponent = iconMap[item.icon]
            const isActive = selectedId === item.id
            return (
              <Link
                key={item.id}
                href={`/legal?doc=${item.id}`}
                scroll={false}
                className={`flex w-full items-center px-4 py-3 rounded-lg transition-colors group text-left ${
                  isActive ? "bg-gray-50 text-steel-blue font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {IconComponent && <IconComponent className="mr-3 text-steel-blue w-5 h-5 shrink-0" />}
                <span className={isActive ? "text-steel-blue" : "group-hover:text-steel-blue"}>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center mb-3">
            <Info className="text-steel-blue mr-2 w-5 h-5" />
            <span className="font-semibold text-steel-blue">Need Help?</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Contact our legal team for questions about compliance or document interpretation.
          </p>
          <a
            href="/help-center"
            className="block w-full bg-steel-blue text-white py-2 px-4 rounded-lg hover:bg-opacity-90 text-sm font-medium text-center transition-colors"
          >
            Contact Legal Team
          </a>
        </div>
      </div>
    </div>
  )
}

export default LegalSidebar
