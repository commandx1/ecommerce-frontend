import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { createProductsUrlBuilder } from "./listing/buildProductsUrl"
import MobileFilters from "./listing/MobileFilters"
import PaginationBar from "./listing/PaginationBar"
import ProductFiltersPanel from "./listing/ProductFiltersPanel"
import ProductGrid from "./listing/ProductGrid"
import ProductListingBreadcrumb from "./listing/ProductListingBreadcrumb"
import ProductListingHeader from "./listing/ProductListingHeader"
import ProductListingToolbar from "./listing/ProductListingToolbar"
import ResultsSummary from "./listing/ResultsSummary"

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
  brands: string[]
  manufacturers: string[]
  currentPage: number
  pageSize: number
  totalPages: number
  viewType: "grid" | "list"
}

const ProductListingClient = ({
  initialProducts,
  totalElements,
  brands,
  manufacturers,
  currentPage,
  pageSize,
  totalPages,
  viewType,
}: ProductListingClientProps) => {
  const buildUrl = createProductsUrlBuilder({ currentPage, pageSize, viewType })

  return (
    <div className="min-h-screen bg-canvas font-sans">
      <MobileFilters brands={brands} manufacturers={manufacturers} />
      <ProductListingBreadcrumb />
      <ProductListingHeader totalElements={totalElements} />
      <ProductListingToolbar buildUrl={buildUrl} viewType={viewType} pageSize={pageSize} />

      <PageSectionContainer as="div" containerClassName="py-8 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden w-72 shrink-0 lg:block">
            <div
              style={{ maxHeight: "calc(100vh - 8rem)" }}
              className="sticky top-28 overflow-y-auto rounded-[1.75rem] border border-border-soft bg-surface-elevated shadow-soft"
            >
              <ProductFiltersPanel brands={brands} manufacturers={manufacturers} />
            </div>
          </aside>

          <main className="flex-1">
            <div className="rounded-4xl border border-border-soft/80 bg-surface-elevated p-4 shadow-soft md:p-6">
              <ResultsSummary totalElements={totalElements} />
              <ProductGrid products={initialProducts} viewType={viewType} />
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
  )
}

export default ProductListingClient
