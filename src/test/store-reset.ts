import { __setBrowserQueryClient } from "@/lib/query/query-client"
import { useAuthStore } from "@/stores/authStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { useFavoriteProductsStore } from "@/stores/favoriteProductsStore"

/**
 * Zustand stores are module singletons, so state survives between test files' test cases.
 * `favoriteProductsStore` also keeps a module-level in-flight promise (`inFlightHydrate`) that a
 * leftover value would let the next test resolve against, cleared by its own `reset()`.
 *
 * `getQueryClient()`'s browser singleton (which holds the cart) is the same kind of module-level
 * leftover: a test that installed a client via `renderWithProviders`/`createQueryWrapper` would
 * leak that cache into the next test. Resetting it to `undefined` makes the next
 * `getQueryClient()` call lazily create a fresh one.
 */
export const resetAllStores = (): void => {
  useCheckoutStore.getState().reset()
  useAuthStore.getState().clearAuth()
  useFavoriteProductsStore.getState().reset()
  __setBrowserQueryClient(undefined)
}
