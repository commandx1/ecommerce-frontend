"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { cartQueryOptions, EMPTY_CART } from "@/features/cart/api/cart-queries"
import { type CartItem, cartAPI } from "@/lib/api/cart"
import { queryKeys } from "@/lib/query/keys"

/**
 * Reader hooks for the `cart.detail` entry (design doc §5). Each is a disabled observer: it
 * re-renders on cache changes but never fetches. Fetching belongs to the explicit owners
 * (`refreshCart()` on useCartPage / useCheckoutPage / DashboardHeader mount, useAuthHydration)
 * and to the write commands. Deliberately not enabled observers with the 1 s staleTime: every
 * reader mount (checkout steps, badges) would then refetch a stale cart, adding GET /cart calls
 * and a mid-checkout "cart changed" bounce path in useCheckoutCartSync.
 */

export function useCartItems(): CartItem[] {
  const { data } = useQuery({
    ...cartQueryOptions(),
    enabled: false,
    select: (cart) => cart.cartItems,
  })

  return data ?? EMPTY_CART.cartItems
}

/** Badge count: the sum of item quantities, not the number of lines. */
export function useCartCount(): number {
  const { data } = useQuery({
    ...cartQueryOptions(),
    enabled: false,
    select: (cart) => cart.cartItems.reduce((total, item) => total + item.quantity, 0),
  })

  return data ?? 0
}

export function useCartId(): string | null {
  const { data } = useQuery({
    ...cartQueryOptions(),
    enabled: false,
    select: (cart) => cart.cartId,
  })

  return data ?? null
}

export interface TaxEstimateQueryParams {
  /** `null` when no default address is available yet - the query stays disabled. */
  addressId: string | null
  shippingAmount: number
  itemCount: number
  /** Caller-built signature of the cart lines this estimate is for (see call sites). */
  linesSignature: string
}

export interface TaxEstimateResult {
  /**
   * `null` = not yet estimated (no address/items, an unusable shipping figure, or the estimate
   * call failed) - distinct from a real $0 estimate the backend returned.
   */
  tax: number | null
  isTaxLoading: boolean
}

/**
 * `POST /cart/tax-estimate` as a read-only query (design doc §6). `enabled` mirrors today's guard
 * in `useCartPage`/`useOrderSummary`: a chosen address, at least one line, and a shipping figure
 * the backend can accept (`CartTaxEstimateRequest.shippingAmount` is `@NotNull @PositiveOrZero`).
 * `placeholderData: keepPreviousData` keeps the previous estimate on screen while a new one is in
 * flight, instead of flashing back to "calculated at checkout". `retry: false` mirrors the old
 * bare try/catch (one request, immediate `null` fallback on any failure) - a money-adjacent
 * estimate must not sit an extra retry delay before falling back.
 */
export function useTaxEstimateQuery(params: TaxEstimateQueryParams): TaxEstimateResult {
  const { addressId, shippingAmount, itemCount, linesSignature } = params
  const enabled = Boolean(addressId) && itemCount > 0 && Number.isFinite(shippingAmount) && shippingAmount >= 0

  const query = useQuery({
    queryKey: queryKeys.cart.taxEstimate({ addressId: addressId ?? "", shippingAmount, linesSignature }),
    queryFn: () => cartAPI.getTaxEstimate({ addressId: addressId as string, shippingAmount }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  // v5 keeps serving placeholder data to a disabled observer, so `enabled` must be checked
  // explicitly here too - otherwise a cleared cart would still show the last estimate.
  const tax = enabled && query.data && Number.isFinite(query.data.taxAmount) ? query.data.taxAmount : null
  const isTaxLoading = enabled && query.isFetching

  return { tax, isTaxLoading }
}
