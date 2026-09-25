import { queryOptions } from "@tanstack/react-query"
import { type FavoriteProductItem, getMyFavoriteProducts } from "@/lib/api/favorite-products"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /products/favorites` (Phase 4 design doc §2.1/§5, D2). Only the list read migrates here -
 * `favoriteProductsStore` (ids + the optimistic heart toggle every `ProductCard` uses) stays
 * client state, out of scope (§5): it is read app-wide, not just by this tab.
 *
 * `staleTime: 0, gcTime: 0, retry: false` (§2.2 fetch policy parity).
 */
export function favoriteProductsListOptions(enabled = true) {
  return queryOptions<FavoriteProductItem[]>({
    queryKey: queryKeys.favoriteProducts.list(),
    queryFn: () => getMyFavoriteProducts(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
