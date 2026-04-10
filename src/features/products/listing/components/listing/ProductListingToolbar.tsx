import { LayoutGrid, List, RotateCcw } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductListingToolbarProps {
  buildUrl: (overrides: { page?: number; size?: number; view?: "grid" | "list" }) => string
  viewType: "grid" | "list"
  pageSize: number
}

const ProductListingToolbar = ({ buildUrl, viewType, pageSize }: ProductListingToolbarProps) => {
  return (
    <section className="border-b border-border-soft bg-canvas py-4">
      <PageSectionContainer as="div">
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-border-soft bg-surface-elevated px-4 py-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-2 py-1">
              <span className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">View</span>
              <Link
                href={buildUrl({ view: "grid" })}
                scroll={false}
                className={`rounded-full p-2 transition-colors ${viewType === "grid" ? "bg-brand text-white" : "text-text-muted hover:bg-accent hover:text-brand"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Link>
              <Link
                href={buildUrl({ view: "list" })}
                scroll={false}
                className={`rounded-full p-2 transition-colors ${viewType === "list" ? "bg-brand text-white" : "text-text-muted hover:bg-accent hover:text-brand"}`}
              >
                <List className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Items per page</span>
              {[10, 20, 50, 100].map((size) => (
                <Link
                  key={size}
                  href={buildUrl({ size, page: 1 })}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    pageSize === size
                      ? "bg-brand text-white"
                      : "border border-border-soft bg-surface text-text-secondary hover:border-brand/30 hover:text-brand"
                  }`}
                >
                  {size}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Sort by</span>
              <Select defaultValue="best-match">
                <SelectTrigger className="h-9 rounded-full border-border-soft bg-surface px-4 py-2 shadow-soft">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best-match">Best Match</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Best Rating</SelectItem>
                  <SelectItem value="brand">Brand A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              className="flex items-center text-sm font-medium text-brand transition-colors hover:text-brand-strong"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </button>
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductListingToolbar
