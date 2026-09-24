"use client"

import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { type Address, addressAPI } from "@/lib/api/address"
import { queryKeys } from "@/lib/query/keys"

/**
 * `GET /address` as a query (Phase 2 design doc §6). Lives under `features/checkout` rather than
 * `features/cart`: addresses are a shipping/checkout concept, and `useShippingDetails` (checkout
 * step 3) is the primary long-term consumer once it migrates in a later step. `useCartPage` also
 * uses this today for its default-address tax-estimate lookup.
 *
 * `staleTime: 0, gcTime: 0`: address writes still go through the unmigrated buyer settings pages
 * (`onAddAddress` navigates there), so caching the list here would hide a newly added address;
 * `gcTime: 0` reproduces today's per-mount fetch. `retry: false` mirrors the old bare try/catch
 * (one request, immediate empty-state fallback on any failure) - `addressAPI` keeps its own
 * in-flight/2s dedupe, so more than one reader mounting within that window still makes a single
 * HTTP request.
 */
export function useAddressesQuery(): UseQueryResult<Address[]> {
  return useQuery({
    queryKey: queryKeys.addresses.list(),
    queryFn: () => addressAPI.getAddresses(),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
