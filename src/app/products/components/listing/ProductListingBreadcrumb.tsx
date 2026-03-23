import { ChevronRight } from "lucide-react"
import Link from "next/link"

const ProductListingBreadcrumb = () => {
  return (
    <section className="bg-white border-b border-gray-200 py-3">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
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
      </div>
    </section>
  )
}

export default ProductListingBreadcrumb
