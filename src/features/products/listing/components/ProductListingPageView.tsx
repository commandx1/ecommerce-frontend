import ProductListingClient from "@/features/products/listing/components/ProductListingClient"
import type { ListingPageData } from "../server/get-listing-page-data"
import type { ParsedListingSearchParams } from "../server/parse-listing-search-params"

interface ProductListingPageViewProps {
  data: ListingPageData
  params: ParsedListingSearchParams
}

export default function ProductListingPageView({ data, params }: ProductListingPageViewProps) {
  return (
    <ProductListingClient
      initialProducts={data.products}
      totalElements={data.totalElements}
      brands={data.brands}
      manufacturers={data.manufacturers}
      categories={data.categories}
      vendors={data.vendors}
      attributeGroups={data.attributeGroups}
      currentPage={params.displayPage}
      pageSize={params.pageSize}
      totalPages={data.totalPages}
      sort={params.sort}
      selectedBrands={params.brands}
      selectedManufacturers={params.manufacturers}
      selectedCategories={params.categories}
      selectedVendors={params.vendors}
      minPrice={params.minPrice}
      maxPrice={params.maxPrice}
      minRating={params.minRating}
      inStock={params.inStock}
      selectedAttributes={params.attributes}
      companyId={params.companyId}
    />
  )
}
