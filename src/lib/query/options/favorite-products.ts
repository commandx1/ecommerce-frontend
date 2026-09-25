import { queryOptions } from "@tanstack/react-query"
import { type FavoriteProductItem, getMyFavoriteProducts } from "@/lib/api/favorite-products"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /products/favorites` (the list only). The favourite ids and the optimistic heart toggle stay
 * in `favoriteProductsStore`: they are read app-wide, not just by this tab.
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
