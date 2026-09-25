import { queryOptions } from "@tanstack/react-query"
import { type Address, addressAPI } from "@/lib/api/address"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /address`, role-neutral: checkout, buyer settings and auto-orders readiness share one key,
 * so a write from any of them invalidates every reader. `addressAPI` keeps its own 2s in-flight
 * dedupe, so readers mounting together still make a single request.
 */
export function addressesListOptions(enabled = true) {
  return queryOptions<Address[]>({
    queryKey: queryKeys.addresses.list(),
    queryFn: () => addressAPI.getAddresses(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
