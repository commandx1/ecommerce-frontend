import { __setBrowserQueryClient } from "@/lib/query/query-client"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { useFavoriteProductsStore } from "@/stores/favoriteProductsStore"

/**
 * Zustand stores are module singletons, so state survives between test files' test cases.
 *
 * `cartStore` is a projection of the cart query cache entry (Phase 2): `resetCart()` resets the
 * projected state, and dropping the browser QueryClient singleton below also drops the in-flight
 * cart request / cached cart it was projecting (the store unsubscribes from that client).
 * `favoriteProductsStore` keeps a module-level in-flight promise (`inFlightHydrate`) that a
 * leftover value would let the next test resolve against, cleared by its own `reset()`.
 *
 * `getQueryClient()`'s browser singleton is the same kind of module-level leftover: a test
 * that installed a client via `renderWithProviders`/`createQueryWrapper` and forgot to reset it
 * would leak that cache into the next test file. Clearing it here (back to `undefined`) makes
 * the next `getQueryClient()` call lazily create a fresh one.
 */
export const resetAllStores = (): void => {
  useCartStore.getState().resetCart()
  useCheckoutStore.getState().reset()
  useAuthStore.getState().clearAuth()
  useFavoriteProductsStore.getState().reset()
  __setBrowserQueryClient(undefined)
}
