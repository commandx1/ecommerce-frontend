import { Filter, X } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import type { AttributeGroup, FilterOption, VendorOption } from "@/lib/api/public-products"
import ProductFiltersPanel from "./ProductFiltersPanel"

interface MobileFiltersProps {
  brands: FilterOption[]
  manufacturers: FilterOption[]
  categories: FilterOption[]
  vendors: VendorOption[]
  attributeGroups: AttributeGroup[]
}

const MobileFilters = ({ brands, manufacturers, categories, vendors, attributeGroups }: MobileFiltersProps) => {
  return (
    <PageSectionContainer as="div" className="lg:hidden" containerClassName="pt-4">
      <details className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
        <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-semibold text-brand">
          <span className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </span>
          <X className="w-4 h-4 text-text-muted" />
        </summary>
        <div className="border-t border-border-soft">
          <ProductFiltersPanel
            brands={brands}
            manufacturers={manufacturers}
            categories={categories}
            vendors={vendors}
            attributeGroups={attributeGroups}
          />
        </div>
      </details>
    </PageSectionContainer>
  )
}

export default MobileFilters
