import { queryOptions } from "@tanstack/react-query"
import {
  getMyFavoriteVendorIds,
  getMyFavoriteVendors,
  getVendors,
  type VendorListItem,
  type VendorPageResponse,
} from "@/lib/api/vendors"
import { queryKeys, type VendorDirectoryParams } from "@/lib/query/keys"

/**
 * Every param is required (`null` when unset) so two callers cannot drift into two keys for one
 * request. A page/sort/rating change fetches once and shows the loading state (no cache, no retry).
 */
export function vendorsDirectoryOptions(params: VendorDirectoryParams, enabled = true) {
  return queryOptions<VendorPageResponse>({
    queryKey: queryKeys.vendors.directory(params),
    queryFn: ({ signal }) =>
      getVendors({
        page: params.page,
        size: params.size,
        sort: params.sort ?? undefined,
        minRating: params.minRating ?? undefined,
        search: params.search || undefined,
        signal,
      }),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

/** `GET /vendors/favorite-ids` - read by the directory to mark starred cards. */
export function vendorFavoriteIdsOptions(enabled = true) {
  return queryOptions<string[]>({
    queryKey: queryKeys.vendors.favorites.ids(),
    queryFn: () => getMyFavoriteVendorIds(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

/** `GET /vendors/favorites` - the full favourited-vendor records read by `FavoriteSuppliersPage`. */
export function vendorFavoritesListOptions(enabled = true) {
  return queryOptions<VendorListItem[]>({
    queryKey: queryKeys.vendors.favorites.list(),
    queryFn: () => getMyFavoriteVendors(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
