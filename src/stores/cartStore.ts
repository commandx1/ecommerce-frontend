import { create } from "zustand"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { type CartItem, cartAPI } from "@/lib/api/cart"

interface CartStore {
  cartId: string | null
  items: CartItem[]
  cartCount: number
  isLoading: boolean
  error: string | null
  resetCart: () => void
  fetchCart: () => Promise<void>
  addToCart: (userProductId: string, quantity?: number) => Promise<void>
  removeFromCart: (userProductId: string) => Promise<void>
  updateQuantity: (userProductId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartId: null,
  items: [],
  cartCount: 0,
  isLoading: false,
  error: null,

  resetCart: () => {
    set({
      cartId: null,
      items: [],
      cartCount: 0,
      isLoading: false,
      error: null,
    })
  },

  fetchCart: async () => {
    set({ isLoading: true, error: null })
    try {
      const cart = await cartAPI.getCart()
      set({
        cartId: cart.cartId,
        items: cart.cartItems,
        cartCount: cart.cartItems.reduce((acc, item) => acc + item.quantity, 0),
        isLoading: false,
      })
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        set({ isLoading: false })
        return
      }

      const status = extractErrorStatus(error)

      // If 400 or 404, it might mean no cart exists yet
      if (status === 400 || status === 404) {
        set({ items: [], cartCount: 0, cartId: null, isLoading: false })
      } else {
        const message = error instanceof Error ? error.message : "Failed to fetch cart"
        set({ error: message, isLoading: false })
      }
    }
  },

  addToCart: async (userProductId, quantity = 1) => {
    set({ isLoading: true, error: null })
    try {
      await cartAPI.addItem(userProductId, quantity)
      await get().fetchCart()
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
    }
  },

  removeFromCart: async (userProductId) => {
    set({ isLoading: true, error: null })
    try {
      await cartAPI.removeItem(userProductId)
      await get().fetchCart()
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        set({ isLoading: false })
        return
      }

      const message = error instanceof Error ? error.message : "Failed to remove item"
      set({ error: message, isLoading: false })
    }
  },

  updateQuantity: async (userProductId, quantity) => {
    if (quantity <= 0) {
      await get().removeFromCart(userProductId)
      return
    }
    set({ isLoading: true, error: null })
    try {
      await cartAPI.updateItemQuantity(userProductId, quantity)
      await get().fetchCart()
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        set({ isLoading: false })
        return
      }

      const message = error instanceof Error ? error.message : "Failed to update quantity"
      set({ error: message, isLoading: false })
    }
  },

  clearCart: async () => {
    const { cartId } = get()
    if (!cartId) return
    set({ isLoading: true, error: null })
    try {
      await cartAPI.clearCart(cartId)
      set({ items: [], cartCount: 0, cartId: null, isLoading: false })
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
