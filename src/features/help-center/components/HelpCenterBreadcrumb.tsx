import { ChevronRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

export default function HelpCenterBreadcrumb() {
  return (
    <section className="border-b border-border-soft bg-surface">
      <PageSectionContainer as="div" containerClassName="py-4">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-text-muted hover:text-brand">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-text-muted" />
          <span className="font-medium text-brand">Support Center</span>
        </div>
      </PageSectionContainer>
    </section>
  )
}
