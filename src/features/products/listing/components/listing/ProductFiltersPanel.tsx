"use client"

import BrandFilter from "../BrandFilter"
import ManufacturerFilter from "../ManufacturerFilter"
import RatingFilter from "../RatingFilter"
import {
  FilterNavigationContext,
  useFilterNavigationProvider,
  useProductFiltersNavigation,
} from "../../hooks/useProductFiltersNavigation"
import ActiveFilters from "./ActiveFilters"
import AvailabilityFilter from "./AvailabilityFilter"
import PriceRangeFilter from "./PriceRangeFilter"

interface ProductFiltersPanelProps {
  brands: string[]
  manufacturers: string[]
}

const ProductFiltersPanel = ({ brands, manufacturers }: ProductFiltersPanelProps) => {
  const value = useFilterNavigationProvider()

  return (
    <FilterNavigationContext.Provider value={value}>
      <FiltersPanelContent brands={brands} manufacturers={manufacturers} />
    </FilterNavigationContext.Provider>
  )
}

function FiltersPanelContent({ brands, manufacturers }: ProductFiltersPanelProps) {
  const { isPending } = useProductFiltersNavigation()

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? "none" : undefined }}
    >
      <ActiveFilters />
      <BrandFilter brands={brands} />
      <ManufacturerFilter manufacturers={manufacturers} />
      <PriceRangeFilter />
      <AvailabilityFilter />
      <RatingFilter />
    </div>
  )
}

export default ProductFiltersPanel
