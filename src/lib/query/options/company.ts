import { queryOptions } from "@tanstack/react-query"
import { type CompanyProfile, getMyCompany } from "@/lib/api/company"
import { queryKeys } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT } from "@/lib/query/query-client"

/**
 * `GET /companies/me`, one entry shared by `CompanyInfoCard` and `CompanyRoleContext`: a save from
 * either updates the entry both read (two mounts still make two GETs).
 */
export function companyMeOptions(enabled = true) {
  return queryOptions<CompanyProfile>({
    queryKey: queryKeys.company.me(),
    queryFn: () => getMyCompany(),
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
  })
}
