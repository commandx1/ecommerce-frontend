import { ChevronRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

const ProductListingBreadcrumb = () => {
  return (
    <section className="bg-white border-b border-gray-200 py-3">
      <PageSectionContainer as="div">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-steel-blue hover:underline">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <Link href="/categories" className="text-steel-blue hover:underline">
            Categories
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">All Products</span>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductListingBreadcrumb
