import { queryOptions } from "@tanstack/react-query"
import { type License, licenseAPI } from "@/lib/api/licenses"
import { queryKeys } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT } from "@/lib/query/query-client"

/**
 * `GET /licenses`. `useDentalLicenseGate` deliberately does not use this cache: it is a
 * fail-closed security gate that must not serve a cached "valid" across routes.
 */
export function licensesListOptions(enabled = true) {
  return queryOptions<License[]>({
    queryKey: queryKeys.licenses.list(),
    queryFn: () => licenseAPI.getLicenses(),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
  })
}
