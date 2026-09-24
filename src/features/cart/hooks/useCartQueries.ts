"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { cartQueryOptions, EMPTY_CART } from "@/features/cart/api/cart-queries"
import { type CartItem, cartAPI } from "@/lib/api/cart"
import { queryKeys } from "@/lib/query/keys"

/**
 * Reader hooks for the `cart.detail` query cache entry (design doc §5). Every one of them is a
 * disabled observer (`enabled: false`): it subscribes to the cache and re-renders when the entry
 * changes, but never triggers a fetch of its own - that stays the job of the fetch *owners*
 * (`refreshCart` on `useCartPage`/`useCheckoutPage`/`DashboardHeader` mount and
 * `useAuthHydration`) and the write commands in `cart-queries.ts`. Mounting a badge or any other
 * reader must not add a `GET /cart`.
 */

export function useCartItems(): CartItem[] {
  const { data } = useQuery({
    ...cartQueryOptions(),
    enabled: false,
    select: (cart) => cart.cartItems,
  })

  return data ?? EMPTY_CART.cartItems
}

/** Sum of item quantities - same definition as the old `cartStore.cartCount`. */
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
