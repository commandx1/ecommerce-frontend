import BrandFilter from "../BrandFilter"
import ManufacturerFilter from "../ManufacturerFilter"
import RatingFilter from "../RatingFilter"
import ActiveFilters from "./ActiveFilters"
import AvailabilityFilter from "./AvailabilityFilter"
import PriceRangeFilter from "./PriceRangeFilter"

interface ProductFiltersPanelProps {
  brands: string[]
  manufacturers: string[]
}

const ProductFiltersPanel = ({ brands, manufacturers }: ProductFiltersPanelProps) => {
  return (
    <>
      <ActiveFilters />
      <BrandFilter brands={brands} />
      <ManufacturerFilter manufacturers={manufacturers} />
      <PriceRangeFilter />
      <AvailabilityFilter />
      <RatingFilter />
    </>
  )
}

export default ProductFiltersPanel
