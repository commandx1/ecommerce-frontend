import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import { productsAPI, type UserProductSortBy } from "@/lib/api/products"
import { queryKeys, type VendorProductListParams } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT } from "@/lib/query/query-client"
import { mapFilterProductsToRows, mapReviewItemsToRows } from "../lib/product-list-mappers"
import type { ProductWithDetails } from "../types"

export interface VendorProductsListResult {
  rows: ProductWithDetails[]
  totalPages: number
  totalElements: number
}

/**
 * One query serves both views of the products list: the review queue reads
 * `GET /api/products/my-products`, everything else `GET /api/user-products/filter`. Both map to
 * `VendorProductsListResult` so the hook and its cache patches never branch on `params.view`.
 * `keepPreviousData` keeps the previous page's rows on screen while a new one loads.
 */
export function vendorProductsListOptions(
  params: VendorProductListParams,
  enabled: boolean,
  accessToken: string | null,
) {
  return queryOptions<VendorProductsListResult>({
    queryKey: queryKeys.vendor.products.list(params),
    queryFn: async ({ signal }): Promise<VendorProductsListResult> => {
      const token = accessToken as string

      if (params.view === "review") {
        const response = await productsAPI.getMyProducts(
          token,
          {
            approved: params.approved,
            sortBy: params.sortBy,
            sortDir: params.sortDir,
            page: params.page,
            size: params.size,
          },
          signal,
        )
        return {
          rows: mapReviewItemsToRows(response.content),
          totalPages: response.totalPages,
          totalElements: response.totalElements,
        }
      }

      const response = await productsAPI.filterUserProducts(
        token,
        params.type,
        params.page,
        params.size,
        (params.sortBy as UserProductSortBy | null) ?? undefined,
        params.sortDir ?? undefined,
        params.search,
        params.howManySoldDay ?? undefined,
        params.userProductId ?? undefined,
        params.brand ?? undefined,
        signal,
      )
      return {
        rows: mapFilterProductsToRows(response.content),
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      }
    },
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
    placeholderData: keepPreviousData,
  })
}

/**
 * The brand list barely moves and the filter needs it on every visit, so it stays cached across
 * mounts. A failure degrades to an empty option list rather than blocking the page.
 */
export function vendorProductBrandsOptions(enabled: boolean, accessToken: string | null) {
  return queryOptions<string[]>({
    queryKey: queryKeys.vendor.products.brands(),
    queryFn: async ({ signal }) => {
      const brands = await productsAPI.getUserProductBrands(accessToken as string, signal)
      return Array.isArray(brands) ? brands.filter(Boolean) : []
    },
    enabled,
    staleTime: 10 * 60_000,
    retry: false,
  })
}
