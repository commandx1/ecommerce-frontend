"use client"

import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import type { Address } from "@/lib/api/address"
import { addressesListOptions } from "@/lib/query/options/addresses"

/** The shared `addressesListOptions` read; used by checkout shipping and the cart's tax estimate. */
export function useAddressesQuery(): UseQueryResult<Address[]> {
  return useQuery(addressesListOptions())
}
