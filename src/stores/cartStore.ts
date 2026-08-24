import { create } from "zustand"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { type CartItem, cartAPI } from "@/lib/api/cart"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"

const FETCH_DEDUP_WINDOW_MS = 1000
let inFlightCartFetch: Promise<void> | null = null

interface FetchCartOptions {
  force?: boolean
}

/**
 * The backend overwrites `cart_item.auto_order` with whatever the request body
 * carries, so a write that does not mention the schedule would wipe it. Passing
 * `undefined` means "keep whatever is on the item"; pass `null` to clear it.
 */
type AutoOrderWrite = AutoOrderPeriod | null | undefined

function findItem(items: CartItem[], userProductId: string): CartItem | undefined {
  return items.find((item) => item.userProduct.userProductId === userProductId)
}

function resolveAutoOrder(items: CartItem[], userProductId: string, requested: AutoOrderWrite): AutoOrderPeriod | null {
  if (requested !== undefined) {
    return requested
  }

  return findItem(items, userProductId)?.autoOrder ?? null
}

interface CartStore {
  cartId: string | null
  items: CartItem[]
  cartCount: number
  isLoading: boolean
  error: string | null
  lastFetchedAt: number
  resetCart: () => void
  fetchCart: (options?: FetchCartOptions) => Promise<void>
  addToCart: (userProductId: string, quantity?: number, autoOrder?: AutoOrderWrite) => Promise<void>
  removeFromCart: (userProductId: string) => Promise<void>
  updateQuantity: (userProductId: string, quantity: number, autoOrder?: AutoOrderWrite) => Promise<void>
  setItemAutoOrder: (userProductId: string, autoOrder: AutoOrderPeriod | null, quantity?: number) => Promise<void>
  clearCart: () => Promise<void>
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartId: null,
  items: [],
  cartCount: 0,
  isLoading: false,
  error: null,
  lastFetchedAt: 0,

  resetCart: () => {
    inFlightCartFetch = null
    set({
      cartId: null,
      items: [],
      cartCount: 0,
      isLoading: false,
      error: null,
      lastFetchedAt: 0,
    })
  },

  fetchCart: async (options = {}) => {
    const force = options.force ?? false
    const now = Date.now()
    const { lastFetchedAt } = get()

    if (inFlightCartFetch) {
      return inFlightCartFetch
    }

    if (!force && now - lastFetchedAt < FETCH_DEDUP_WINDOW_MS) {
      return
    }

    const fetchTask = async () => {
      set({ isLoading: true, error: null })
      try {
        const cart = await cartAPI.getCart()
        set({
          cartId: cart.cartId,
          items: cart.cartItems,
          cartCount: cart.cartItems.reduce((acc, item) => acc + item.quantity, 0),
          isLoading: false,
          lastFetchedAt: Date.now(),
        })
      } catch (error: unknown) {
        if (isAuthHandledError(error)) {
          // Don't stamp `lastFetchedAt` here: the auth interceptor already ran `resetCart()`
          // (zeroing it) before this rejection reached us. Re-stamping "now" would re-open the
          // dedup window and leave the user staring at an empty cart for ~1s right after login.
          set({ isLoading: false })
          return
        }

        const status = extractErrorStatus(error)

        // If 400 or 404, it might mean no cart exists yet
        if (status === 400 || status === 404) {
          set({ items: [], cartCount: 0, cartId: null, isLoading: false, lastFetchedAt: Date.now() })
        } else {
          const message = error instanceof Error ? error.message : "Failed to fetch cart"
          // Still stamp `lastFetchedAt` on failure so the dedup window is actually established -
          // otherwise a downed backend gets hammered with an uninterrupted stream of retries.
          set({ error: message, isLoading: false, lastFetchedAt: Date.now() })
        }
      }
    }

    inFlightCartFetch = fetchTask()
    try {
      await inFlightCartFetch
    } finally {
      inFlightCartFetch = null
    }
  },

  addToCart: async (userProductId, quantity = 1, autoOrder) => {
    set({ isLoading: true, error: null })
    try {
      await cartAPI.addItem(userProductId, quantity, resolveAutoOrder(get().items, userProductId, autoOrder))
      await get().fetchCart({ force: true })
    } catch (error: unknown) {
      set({ isLoading: false })
      if (isAuthHandledError(error)) {
        throw error
      }

      const status = extractErrorStatus(error)
      if (isAuthErrorStatus(status)) {
        throw error
      }

      const message = error instanceof Error ? error.message : "Failed to add item"
      set({ error: message })
      // Rethrown so the caller's catch block actually runs. Swallowing it here left the UI
      // showing a finished spinner and no warning at all while the item never entered the cart.
      throw error
    }
  },

  removeFromCart: async (userProductId) => {
    set({ isLoading: true, error: null })
    try {
      await cartAPI.removeItem(userProductId)
      await get().fetchCart({ force: true })
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        set({ isLoading: false })
        return
      }

      const message = error instanceof Error ? error.message : "Failed to remove item"
      set({ error: message, isLoading: false })
    }
  },

  updateQuantity: async (userProductId, quantity, autoOrder) => {
    if (quantity <= 0) {
      await get().removeFromCart(userProductId)
      return
    }
    set({ isLoading: true, error: null })
    try {
      await cartAPI.updateItemQuantity(userProductId, quantity, resolveAutoOrder(get().items, userProductId, autoOrder))
      await get().fetchCart({ force: true })
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        set({ isLoading: false })
        return
      }

      const message = error instanceof Error ? error.message : "Failed to update quantity"
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Quantity and schedule share one endpoint, so an explicit `quantity` lets the
   * caller flush a still-debounced quantity edit in the same write.
   */
  setItemAutoOrder: async (userProductId, autoOrder, quantity) => {
    const item = findItem(get().items, userProductId)
    if (!item) return

    const nextQuantity = quantity ?? item.quantity
    if (nextQuantity <= 0) {
      await get().removeFromCart(userProductId)
      return
    }

    set({ isLoading: true, error: null })
    try {
      await cartAPI.updateItemQuantity(userProductId, nextQuantity, autoOrder)
      await get().fetchCart({ force: true })
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        set({ isLoading: false })
        return
      }

      // Deliberately does NOT write the shared `error` state, unlike addToCart. The only caller
      // (useCartPage) already shows its own "Could not update auto-reorder" toast from the
      // rethrow below, and it ALSO renders a generic "Cart unavailable" toast whenever `error`
      // changes - setting it here fires both toasts for one failure. The wider inconsistency
      // (addToCart/setItemAutoOrder throw, removeFromCart/updateQuantity return silently) is a
      // contract decision tracked in TEST-FINDINGS.md, not something to fix one function at a time.
      set({ isLoading: false })
      throw error
    }
  },

  clearCart: async () => {
    const { cartId } = get()
    if (!cartId) return
    set({ isLoading: true, error: null })
    try {
      await cartAPI.clearCart(cartId)
      // Reset `lastFetchedAt` (not a self-triggered refetch) so the dedup window doesn't shadow
      // the next `fetchCart` with now-stale pre-clear data.
      set({ items: [], cartCount: 0, cartId: null, isLoading: false, lastFetchedAt: 0 })
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        set({ isLoading: false })
        return
      }

      const message = error instanceof Error ? error.message : "Failed to clear cart"
      set({ error: message, isLoading: false })
    }
  },
}))
export type { CartItem }
