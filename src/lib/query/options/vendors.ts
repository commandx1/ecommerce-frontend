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
 * `GET /vendors` (Phase 4 design doc §2.1/§5, D1). Params are the Phase 4 convention: every
 * field required, `null` when unset, so two callers can never drift into two different-looking
 * keys for the same request.
 *
 * `staleTime: 0, gcTime: 0, retry: false` (§2.2 fetch policy parity): a page/sort/rating change
 * fetches once and shows the loading state, same as the old abort-on-change `useEffect`.
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

/** `GET /vendors/favorite-ids` - read by the directory to mark starred cards (D1). */
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

/** `GET /vendors/favorites` - the full favourited-vendor records read by `FavoriteSuppliersPage` (D1). */
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
