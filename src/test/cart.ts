import type { QueryClient } from "@tanstack/react-query"
import { type CartData, cartQueryOptions, EMPTY_CART } from "@/features/cart/api/cart-queries"
import { queryKeys } from "@/lib/query/keys"

/**
 * Writes the cart query entry the way a completed `GET /cart` would, merging `patch` into
 * whatever is already cached (like a partial store `setState`). The entry gets the app's own cart
 * `gcTime`, so the test client's `gcTime: 0` cannot drop it before a reader mounts. Pass an old
 * `updatedAt` to seed a cart that is already outside the 1 s refresh dedup window.
 */
export function seedCart(client: QueryClient, patch: Partial<CartData> = {}, options?: { updatedAt?: number }): void {
  client.setQueryDefaults(queryKeys.cart.detail(), { gcTime: cartQueryOptions().gcTime })
  client.setQueryData<CartData>(
    queryKeys.cart.detail(),
    (current) => ({ ...(current ?? EMPTY_CART), ...patch }),
    options,
  )
}

/** The cached cart, for assertions. */
export function cachedCart(client: QueryClient): CartData | undefined {
  return client.getQueryData<CartData>(queryKeys.cart.detail())
}
