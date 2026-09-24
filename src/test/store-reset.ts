import { __setBrowserQueryClient } from "@/lib/query/query-client"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { useFavoriteProductsStore } from "@/stores/favoriteProductsStore"

/**
 * Zustand stores are module singletons, so state survives between test files' test cases.
 *
 * `cartStore` additionally keeps a module-level `inFlightCartFetch` promise used to de-duplicate
 * concurrent fetches; a leftover value makes the next test's `fetchCart()` resolve against the
 * previous test's request. `resetCart()` clears it, which is why this global reset is mandatory.
 * `favoriteProductsStore` keeps the same kind of module-level in-flight promise (`inFlightHydrate`)
 * for the same reason, cleared by its own `reset()`.
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
