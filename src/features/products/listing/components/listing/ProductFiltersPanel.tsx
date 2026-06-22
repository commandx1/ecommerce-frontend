"use client"

import type { AttributeGroup, CompanyOption, FilterOption } from "@/lib/api/public-products"
import AttributeFilter from "../AttributeFilter"
import BrandFilter from "../BrandFilter"
import CategoryFilter from "../CategoryFilter"
import CompanyFilter from "../CompanyFilter"
import ManufacturerFilter from "../ManufacturerFilter"
import RatingFilter from "../RatingFilter"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"
import ActiveFilters from "./ActiveFilters"
import AvailabilityFilter from "./AvailabilityFilter"
import PriceRangeFilter from "./PriceRangeFilter"

interface ProductFiltersPanelProps {
  brands: FilterOption[]
  manufacturers: FilterOption[]
  categories: FilterOption[]
  companies: CompanyOption[]
  attributeGroups: AttributeGroup[]
}

const ProductFiltersPanel = ({ brands, manufacturers, categories, companies, attributeGroups }: ProductFiltersPanelProps) => {
  return (
    <FiltersPanelContent brands={brands} manufacturers={manufacturers} categories={categories} companies={companies} attributeGroups={attributeGroups} />
  )
}

function FiltersPanelContent({ brands, manufacturers, categories, companies, attributeGroups }: ProductFiltersPanelProps) {
  const { isPending } = useProductFiltersNavigation()

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? "none" : undefined }}
    >
      <ActiveFilters companies={companies} />
      <CategoryFilter categories={categories} />
      <BrandFilter brands={brands} />
      <ManufacturerFilter manufacturers={manufacturers} />
      <CompanyFilter companies={companies} />
      <PriceRangeFilter />
      <AvailabilityFilter />
      <RatingFilter />
      {attributeGroups.map((group) => (
        <AttributeFilter key={group.attributeName} group={group} />
      ))}
    </div>
  )
}

export default ProductFiltersPanel
