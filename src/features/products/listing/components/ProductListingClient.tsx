import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { createProductsUrlBuilder } from "./listing/buildProductsUrl"
import FeaturedBanner from "./listing/FeaturedBanner"
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
    <div className="bg-light-mint-gray min-h-screen font-inter">
      <MobileFilters brands={brands} manufacturers={manufacturers} />
      <ProductListingBreadcrumb />
      <ProductListingHeader totalElements={totalElements} />
      <ProductListingToolbar buildUrl={buildUrl} viewType={viewType} pageSize={pageSize} />

      <PageSectionContainer as="div" containerClassName="py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-68 shrink-0">
            <div
              style={{ maxHeight: "calc(100vh - 4rem)" }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto sticky top-8 custom-scrollbar"
            >
              <ProductFiltersPanel brands={brands} manufacturers={manufacturers} />
            </div>
          </aside>

          {/* Main Product Grid */}
          <main className="flex-1">
            <ResultsSummary totalElements={totalElements} />
            <FeaturedBanner />
            <ProductGrid products={initialProducts} viewType={viewType} />
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
