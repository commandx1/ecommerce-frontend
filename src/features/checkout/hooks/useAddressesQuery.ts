"use client"

import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import type { Address } from "@/lib/api/address"
import { addressesListOptions } from "@/lib/query/options/addresses"

/**
 * `GET /address` as a query (Phase 2 design doc §6). Lives under `features/checkout` rather than
 * `features/cart`: addresses are a shipping/checkout concept, and `useShippingDetails` (checkout
 * step 3) is the primary long-term consumer once it migrates in a later step. `useCartPage` also
 * uses this today for its default-address tax-estimate lookup.
 *
 * Repoints to the shared `addressesListOptions` (Phase 4 §2.1/K0) - same options object, now also
 * read by buyer account settings and auto-orders readiness once those migrate, so a write from
 * any of them invalidates every reader instead of leaving a stale copy behind.
 */
export function useAddressesQuery(): UseQueryResult<Address[]> {
  return useQuery(addressesListOptions())
}
