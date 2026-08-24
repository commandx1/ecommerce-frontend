"use client"

import type { AttributeGroup, FilterOption, VendorOption } from "@/lib/api/public-products"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"
import AttributeFilter from "../AttributeFilter"
import BrandFilter from "../BrandFilter"
import CategoryFilter from "../CategoryFilter"
import ManufacturerFilter from "../ManufacturerFilter"
import RatingFilter from "../RatingFilter"
import VendorFilter from "../VendorFilter"
import ActiveFilters from "./ActiveFilters"
import AvailabilityFilter from "./AvailabilityFilter"
import PriceRangeFilter from "./PriceRangeFilter"

interface ProductFiltersPanelProps {
  brands: FilterOption[]
  manufacturers: FilterOption[]
  categories: FilterOption[]
  vendors: VendorOption[]
  attributeGroups: AttributeGroup[]
}

const ProductFiltersPanel = ({
  brands,
  manufacturers,
  categories,
  vendors,
  attributeGroups,
}: ProductFiltersPanelProps) => {
  return (
    <FiltersPanelContent
      brands={brands}
      manufacturers={manufacturers}
      categories={categories}
      vendors={vendors}
      attributeGroups={attributeGroups}
    />
  )
}

function FiltersPanelContent({
  brands,
  manufacturers,
  categories,
  vendors,
  attributeGroups,
}: ProductFiltersPanelProps) {
  const { isPending } = useProductFiltersNavigation()

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? "none" : undefined }}
    >
      <ActiveFilters vendors={vendors} />
      <CategoryFilter categories={categories} />
      <BrandFilter brands={brands} />
      <ManufacturerFilter manufacturers={manufacturers} />
      <VendorFilter vendors={vendors} />
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
