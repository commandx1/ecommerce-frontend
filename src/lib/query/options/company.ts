import { queryOptions } from "@tanstack/react-query"
import { type CompanyProfile, getMyCompany } from "@/lib/api/company"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /companies/me` (Phase 4 design doc §2.1/K0). One entry shared by `CompanyInfoCard` and
 * `CompanyRoleContext` (C3b) - two mounts still make two GETs (`staleTime: 0`), but a save from
 * either updates the same cache entry both consumers read. Not wired into either caller yet;
 * this step only adds the shared options object.
 *
 * `staleTime: 0, gcTime: 0, retry: false` (§2.2 fetch policy parity), matching every other
 * migrated read in this phase.
 */
export function companyMeOptions(enabled = true) {
  return queryOptions<CompanyProfile>({
    queryKey: queryKeys.company.me(),
    queryFn: () => getMyCompany(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
