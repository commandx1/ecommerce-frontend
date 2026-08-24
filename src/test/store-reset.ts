import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

/**
 * Zustand stores are module singletons, so state survives between test files' test cases.
 *
 * `cartStore` additionally keeps a module-level `inFlightCartFetch` promise used to de-duplicate
 * concurrent fetches; a leftover value makes the next test's `fetchCart()` resolve against the
 * previous test's request. `resetCart()` clears it, which is why this global reset is mandatory.
 */
export const resetAllStores = (): void => {
  useCartStore.getState().resetCart()
  useCheckoutStore.getState().reset()
  useAuthStore.getState().clearAuth()
}
