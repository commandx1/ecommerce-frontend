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
 * Fans out six server-side fetches in one `Promise.all`. The product-list call is NOT caught: a
 * failed list must reach `app/products/page.tsx`'s error state, not hide behind an empty grid. The
 * five facet fetchers already resolve to `[]` on failure, so a facet outage never breaks the page.
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
  search,
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
      search,
    }),
    getProductBrandOptions(),
    getProductManufacturerOptions(),
    getProductCategoryOptions(),
    getProductVendorOptions(),
    getProductAttributeOptions(),
  ])

  return {
    // Array.isArray, not `|| []`: a malformed 200 carrying an object or string would reach .map().
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
