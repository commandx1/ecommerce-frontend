import { ChevronRight } from "lucide-react"
import Link from "next/link"

const LegalBreadcrumb = () => {
  return (
    <section id="breadcrumb-navigation" className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-steel-blue hover:underline">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <Link href="/support" className="text-steel-blue hover:underline">
            Support
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">Legal & Compliance</span>
        </nav>
      </div>
    </section>
  )
}

export default LegalBreadcrumb
