import type { APIProduct } from "@/features/products/listing/components/ProductListingClient"
import type { AttributeGroup, CompanyOption, FilterOption } from "@/lib/api/public-products"
import {
  getProductAttributeOptions,
  getProductBrandOptions,
  getProductCategoryOptions,
  getProductCompanyOptions,
  getProductManufacturerOptions,
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
  companies: CompanyOption[]
  attributeGroups: AttributeGroup[]
}

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
  const [productsResponse, brands, manufacturers, categories, companies, attributeGroups] = await Promise.all([
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
    getProductCompanyOptions(),
    getProductAttributeOptions(),
  ])

  return {
    products: productsResponse.content || [],
    totalElements: productsResponse.totalElements || 0,
    totalPages: productsResponse.totalPages || 1,
    brands,
    manufacturers,
    categories,
    companies,
    attributeGroups,
  }
}
