import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import { productsAPI, type UserProductSortBy } from "@/lib/api/products"
import { queryKeys, type VendorProductListParams } from "@/lib/query/keys"
import { mapFilterProductsToRows, mapReviewItemsToRows } from "../lib/product-list-mappers"
import type { ProductWithDetails } from "../types"

export interface VendorProductsListResult {
  rows: ProductWithDetails[]
  totalPages: number
  totalElements: number
}

/**
 * One query serves both views of the products list (design §3.1's `VendorProductListParams`
 * union): the review queue reads `GET /api/products/my-products`, everything else reads
 * `GET /api/user-products/filter`. Both branches are mapped to the same `VendorProductsListResult`
 * shape here so the hook and its cache patches never need to branch on `params.view` again.
 *
 * D1 (lead decision): `staleTime: 0, gcTime: 0` — a route revisit refetches and, like every
 * filter/sort/page change, keeps the previous page's rows on screen via `keepPreviousData` while
 * the new one loads (today's `isFetching` overlay), rather than clearing to a skeleton.
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
    staleTime: 0,
    gcTime: 0,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/**
 * The vendor's brand list barely moves and the filter needs it on every visit, so it stays
 * cached across mounts (unchanged from the page's own query before this moved here). A failure
 * degrades to an empty option list rather than blocking the page.
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
