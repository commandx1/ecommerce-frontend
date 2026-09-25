import { queryOptions } from "@tanstack/react-query"
import { type License, licenseAPI } from "@/lib/api/licenses"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /licenses` (Phase 4 design doc §2.1/§5, C3b). One reader today (`LicenseManagementSection`);
 * `useDentalLicenseGate` deliberately stays off Query (§5) - it is a fail-closed security gate
 * that must not serve a cached "valid" across routes, so it keeps its own imperative
 * `ensureChecked()` in-flight-promise guard instead of this cache.
 *
 * `staleTime: 0, gcTime: 0, retry: false` (§2.2 fetch policy parity), matching every other
 * migrated read in this phase.
 */
export function licensesListOptions(enabled = true) {
  return queryOptions<License[]>({
    queryKey: queryKeys.licenses.list(),
    queryFn: () => licenseAPI.getLicenses(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
