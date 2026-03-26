import { ChevronRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

export default function HelpCenterBreadcrumb() {
  return (
    <section className="bg-white border-b border-gray-200">
      <PageSectionContainer as="div" containerClassName="py-4">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-steel-blue">
            Home
          </Link>
          <ChevronRight className="text-gray-400 w-3 h-3" />
          <span className="text-steel-blue font-medium">Support Center</span>
        </div>
      </PageSectionContainer>
    </section>
  )
}
