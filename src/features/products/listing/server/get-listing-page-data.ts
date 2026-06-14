import type { APIProduct } from "@/features/products/listing/components/ProductListingClient"
import { getProductBrands, getProductManufacturers, getPublicProducts } from "@/lib/api/public-products"
import type { ParsedListingSearchParams } from "./parse-listing-search-params"

export interface ListingPageData {
  products: APIProduct[]
  totalElements: number
  totalPages: number
  brands: string[]
  manufacturers: string[]
}

export async function getListingPageData({
  apiPage,
  pageSize,
  sort,
  brands: selectedBrands,
  manufacturers: selectedManufacturers,
  minPrice,
  maxPrice,
  minRating,
  inStock,
}: ParsedListingSearchParams): Promise<ListingPageData> {
  const [productsResponse, brands, manufacturers] = await Promise.all([
    getPublicProducts<APIProduct>(apiPage, pageSize, {
      brands: selectedBrands,
      manufacturers: selectedManufacturers,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort,
    }),
    getProductBrands(),
    getProductManufacturers(),
  ])

  return {
    products: productsResponse.content || [],
    totalElements: productsResponse.totalElements || 0,
    totalPages: productsResponse.totalPages || 1,
    brands,
    manufacturers,
  }
}
