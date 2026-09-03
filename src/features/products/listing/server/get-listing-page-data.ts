import type { APIProduct } from "@/features/products/listing/components/ProductListingClient"
import type { AttributeGroup, FilterOption, VendorOption } from "@/lib/api/public-products"
import {
  getProductAttributeOptions,
  getProductBrandOptions,
  getProductCategoryOptions,
  getProductManufacturerOptions,
  getProductVendorOptions,
  getPublicProducts,
} from "@/lib/api/public-products"
import type { ParsedListingSearchParams } from "./parse-listing-search-params"

export interface ListingPageData {
  products: APIProduct[]
  totalElements: number
  totalPages: number
  brands: FilterOption[]
  manufacturers: FilterOption[]
  categories: FilterOption[]
  vendors: VendorOption[]
  attributeGroups: AttributeGroup[]
}

/**
 * Fans out six server-side fetches in a single `Promise.all`. The product-list call
 * (`getPublicProducts`) is NOT caught here: if it rejects, the rejection propagates out of this
 * function and up to `src/app/products/page.tsx`, whose `try/catch` renders
 * `<ProductListingErrorState />` — a failed product list must be shown to the user, not hidden
 * behind an empty grid (product decision, 3 Sep 2026).
 *
 * The five filter-facet fetchers (brands, manufacturers, categories, vendors, attributes) keep
 * their existing graceful degradation — each already catches internally and resolves to `[]` on
 * failure, so a facet outage never takes down the whole page.
 */
export async function getListingPageData({
  apiPage,
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
  attributes,
  companyId,
}: ParsedListingSearchParams): Promise<ListingPageData> {
  const [productsResponse, brands, manufacturers, categories, vendors, attributeGroups] = await Promise.all([
    getPublicProducts<APIProduct>(apiPage, pageSize, {
      brands: selectedBrands,
      manufacturers: selectedManufacturers,
      categories: selectedCategories,
      vendorIds: selectedVendors,
      companyId,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort,
      attributes,
    }),
    getProductBrandOptions(),
    getProductManufacturerOptions(),
    getProductCategoryOptions(),
    getProductVendorOptions(),
    getProductAttributeOptions(),
  ])

  return {
    // `|| []` only catches null/undefined - a malformed 200 carrying an object or string here
    // reached .map() and took down the whole listing page (infra note #26).
    products: Array.isArray(productsResponse.content) ? productsResponse.content : [],
    totalElements: productsResponse.totalElements || 0,
    totalPages: productsResponse.totalPages || 1,
    brands,
    manufacturers,
    categories,
    vendors,
    attributeGroups,
  }
}
