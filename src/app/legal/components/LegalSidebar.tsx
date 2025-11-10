"use client"

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
import { useEffect, useState } from "react"
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

const LegalSidebar = () => {
  const [activeSection, setActiveSection] = useState<string>("")

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -80% 0px",
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id")
          if (id) {
            setActiveSection(id)
          }
        }
      })
    }, observerOptions)

    const sections = document.querySelectorAll("#document-content section[id]")
    sections.forEach((section) => {
      observer.observe(section)
    })

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section)
      })
    }
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <div id="sidebar-navigation" className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-36">
        <h3 className="text-lg font-semibold text-steel-blue mb-4">Document Categories</h3>
        <nav className="space-y-2">
          {legalDocumentsData.sidebarNav.map((item) => {
            const IconComponent = iconMap[item.icon]
            const isActive = activeSection === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${
                  isActive ? "bg-light-mint-gray text-steel-blue font-medium" : "text-gray-700 hover:bg-light-mint-gray"
                }`}
              >
                {IconComponent && <IconComponent className="mr-3 text-steel-blue w-5 h-5" />}
                <span className={isActive ? "text-steel-blue" : "group-hover:text-steel-blue"}>{item.title}</span>
              </a>
            )
          })}
        </nav>

        <div className="mt-8 p-4 bg-light-mint-gray rounded-xl">
          <div className="flex items-center mb-3">
            <Info className="text-steel-blue mr-2 w-5 h-5" />
            <span className="font-semibold text-steel-blue">Need Help?</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Contact our legal team for questions about compliance or document interpretation.
          </p>
          <a
            href="#contact-support"
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
