"use client"

import { useQuery } from "@tanstack/react-query"
import { cartQueryOptions, EMPTY_CART } from "@/features/cart/api/cart-queries"
import type { CartItem } from "@/lib/api/cart"

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
