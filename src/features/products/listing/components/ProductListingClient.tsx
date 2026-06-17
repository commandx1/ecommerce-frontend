import { Suspense } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import type { AttributeGroup, FilterOption, VendorOption } from "@/lib/api/public-products"
import type { SortValue } from "../server/parse-listing-search-params"
import { createProductsUrlBuilder } from "./listing/buildProductsUrl"
import MobileFilters from "./listing/MobileFilters"
import PaginationBar from "./listing/PaginationBar"
import ProductFiltersPanel from "./listing/ProductFiltersPanel"
import ProductGrid from "./listing/ProductGrid"
import ProductListingBreadcrumb from "./listing/ProductListingBreadcrumb"
import ProductListingHeader from "./listing/ProductListingHeader"
import ProductListingToolbar from "./listing/ProductListingToolbar"
import ResultsSummary from "./listing/ResultsSummary"
import FilterNavigationProvider from "./listing/FilterNavigationProvider"

export interface APIProduct {
  productId: string
  productName: string
  brand: string
  barcode: string
  coverPhotoPath: string
  manufacturerCode: string
  reorderId: string
  referanceNumber: string
  overallStar: number
  reviewCount: number
  vendorsCount: number
  bestPriceVendor: string
  price: number
  oldPrice: number
  discount: number
  stock: number
}

interface ProductListingClientProps {
  initialProducts: APIProduct[]
  totalElements: number
  brands: FilterOption[]
  manufacturers: FilterOption[]
  categories: FilterOption[]
  vendors: VendorOption[]
  attributeGroups: AttributeGroup[]
  currentPage: number
  pageSize: number
  totalPages: number
  sort: SortValue
  selectedBrands: string[]
  selectedManufacturers: string[]
  selectedCategories: string[]
  selectedVendors: string[]
  minPrice: number | null
  maxPrice: number | null
  minRating: number | null
  inStock: boolean
  selectedAttributes: string[]
}

const ProductListingClient = ({
  initialProducts,
  totalElements,
  brands,
  manufacturers,
  categories,
  vendors,
  attributeGroups,
  currentPage,
  pageSize,
  totalPages,
  sort,
  selectedBrands,
  selectedManufacturers,
  selectedCategories,
  selectedVendors,
  minPrice,
  maxPrice,
  minRating,
  inStock,
  selectedAttributes,
}: ProductListingClientProps) => {
  const buildUrl = createProductsUrlBuilder({
    currentPage,
    pageSize,
    sort,
    brands: selectedBrands,
    manufacturers: selectedManufacturers,
    categories: selectedCategories,
    vendors: selectedVendors,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    attributes: selectedAttributes,
  })

  return (
    <FilterNavigationProvider>
    <div className="min-h-screen bg-canvas font-sans">
      <Suspense>
        <MobileFilters brands={brands} manufacturers={manufacturers} categories={categories} vendors={vendors} attributeGroups={attributeGroups} />
      </Suspense>
      <ProductListingBreadcrumb />
      <ProductListingHeader totalElements={totalElements} />
      <ProductListingToolbar pageSize={pageSize} />

      <PageSectionContainer as="div" containerClassName="py-8 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden w-72 shrink-0 lg:block">
            <div
              style={{ maxHeight: "calc(100vh - 11.5rem)" }}
              className="sticky top-42 overflow-y-auto rounded-[1.75rem] border border-border-soft bg-surface-elevated shadow-soft"
            >
              <Suspense>
                <ProductFiltersPanel brands={brands} manufacturers={manufacturers} categories={categories} vendors={vendors} attributeGroups={attributeGroups} />
              </Suspense>
            </div>
          </aside>

          <main className="flex-1">
            <div className="rounded-4xl border border-border-soft/80 bg-surface-elevated p-4 shadow-soft md:p-6">
              <ResultsSummary totalElements={totalElements} />
              <ProductGrid products={initialProducts} />
            </div>
            <PaginationBar
              currentPage={currentPage}
              pageSize={pageSize}
              totalElements={totalElements}
              totalPages={totalPages}
              buildUrl={buildUrl}
            />
          </main>
        </div>
      </PageSectionContainer>
    </div>
    </FilterNavigationProvider>
  )
}

export default ProductListingClient
