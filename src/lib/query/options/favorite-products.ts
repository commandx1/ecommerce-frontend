import { queryOptions } from "@tanstack/react-query"
import { type FavoriteProductItem, getMyFavoriteProducts } from "@/lib/api/favorite-products"
import { queryKeys } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT } from "@/lib/query/query-client"

/**
 * `GET /products/favorites` (the list only). The favourite ids and the optimistic heart toggle stay
 * in `favoriteProductsStore`: they are read app-wide, not just by this tab.
 */
export function favoriteProductsListOptions(enabled = true) {
  return queryOptions<FavoriteProductItem[]>({
    queryKey: queryKeys.favoriteProducts.list(),
    queryFn: () => getMyFavoriteProducts(),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
  })
}
