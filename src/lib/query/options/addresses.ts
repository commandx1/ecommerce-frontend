import { queryOptions } from "@tanstack/react-query"
import { type Address, addressAPI } from "@/lib/api/address"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /address` (Phase 4 design doc §2.1/K0). Role-neutral: checkout, buyer account settings
 * and auto-orders readiness all read the same list under the same key, so a write from any of
 * them invalidates every reader instead of leaving a stale copy behind.
 *
 * `staleTime: 0, gcTime: 0, retry: false` (§2.2 fetch policy parity): every mount fetches once,
 * and a failure goes straight to the caller's existing empty-state fallback. `addressAPI` keeps
 * its own in-flight/2s dedupe, so more than one reader mounting within that window still makes a
 * single HTTP request.
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
