import { Filter, X } from "lucide-react"
import type { AttributeGroup, CompanyOption, FilterOption } from "@/lib/api/public-products"
import ProductFiltersPanel from "./ProductFiltersPanel"

interface MobileFiltersProps {
  brands: FilterOption[]
  manufacturers: FilterOption[]
  categories: FilterOption[]
  companies: CompanyOption[]
  attributeGroups: AttributeGroup[]
}

const MobileFilters = ({ brands, manufacturers, categories, companies, attributeGroups }: MobileFiltersProps) => {
  return (
    <div className="lg:hidden px-4 sm:px-6 lg:px-8 pt-4">
      <details className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-semibold text-steel-blue">
          <span className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </span>
          <X className="w-4 h-4 text-gray-400" />
        </summary>
        <div className="border-t border-gray-200">
          <ProductFiltersPanel brands={brands} manufacturers={manufacturers} categories={categories} companies={companies} attributeGroups={attributeGroups} />
        </div>
      </details>
    </div>
  )
}

export default MobileFilters
