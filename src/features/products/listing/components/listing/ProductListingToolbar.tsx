import { LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

interface ProductListingToolbarProps {
  buildUrl: (overrides: { page?: number; size?: number; view?: "grid" | "list" }) => string
  viewType: "grid" | "list"
  pageSize: number
}

const ProductListingToolbar = ({ buildUrl, viewType, pageSize }: ProductListingToolbarProps) => {
  return (
    <section className="bg-white border-b border-gray-200 py-4">
      <PageSectionContainer as="div">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <Link
                href={buildUrl({ view: "grid" })}
                scroll={false}
                className={`p-2 rounded ${viewType === "grid" ? "bg-steel-blue text-white" : "text-gray-400 hover:text-steel-blue"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Link>
              <Link
                href={buildUrl({ view: "list" })}
                scroll={false}
                className={`p-2 rounded ${viewType === "list" ? "bg-steel-blue text-white" : "text-gray-400 hover:text-steel-blue"}`}
              >
                <List className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <div className="flex items-center gap-2">
                {[10, 20, 50, 100].map((size) => (
                  <Link
                    key={size}
                    href={buildUrl({ size, page: 1 })}
                    className={`px-3 py-1 rounded text-sm border ${
                      pageSize === size
                        ? "border-steel-blue bg-steel-blue text-white"
                        : "border-gray-300 text-gray-600 hover:text-steel-blue hover:border-steel-blue"
                    }`}
                  >
                    {size}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue bg-white">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
                <option>Most Popular</option>
                <option>Best Rating</option>
                <option>Brand A-Z</option>
              </select>
            </div>
            <button type="button" className="text-sm text-steel-blue hover:underline flex items-center">
              Reset Filters
            </button>
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductListingToolbar
