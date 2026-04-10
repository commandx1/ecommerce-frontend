import { ChevronRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

const ProductListingBreadcrumb = () => {
  return (
    <section className="border-b border-border-soft bg-surface py-3">
      <PageSectionContainer as="div">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-brand hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-text-muted" />
          <Link href="/categories" className="text-brand hover:underline">
            Categories
          </Link>
          <ChevronRight className="h-3 w-3 text-text-muted" />
          <span className="text-text-secondary">All Products</span>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductListingBreadcrumb
