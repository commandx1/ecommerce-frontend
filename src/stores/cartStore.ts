import { create } from "zustand"
import { type CartItem, cartAPI } from "@/lib/api/cart"

interface CartStore {
  cartId: string | null
  items: CartItem[]
  cartCount: number
  isLoading: boolean
  error: string | null
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
    } catch (error: any) {
      // If 400 or 404, it might mean no cart exists yet
      if (error.status === 400 || error.status === 404) {
        set({ items: [], cartCount: 0, cartId: null, isLoading: false })
      } else {
        set({ error: error.message || "Failed to fetch cart", isLoading: false })
      }
    }
  },

  addToCart: async (userProductId, quantity = 1) => {
    set({ isLoading: true, error: null })
    try {
      await cartAPI.addItem(userProductId, quantity)
      await get().fetchCart()
    } catch (error: any) {
      const status = error?.response?.status
      set({ isLoading: false })
      if (status === 403) {
        throw error
      }
      set({ error: error?.message || "Failed to add item" })
    }
  },

  removeFromCart: async (userProductId) => {
    set({ isLoading: true, error: null })
    try {
      await cartAPI.removeItem(userProductId)
      await get().fetchCart()
    } catch (error: any) {
      set({ error: error.message || "Failed to remove item", isLoading: false })
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
    } catch (error: any) {
      set({ error: error.message || "Failed to update quantity", isLoading: false })
    }
  },

  clearCart: async () => {
    const { cartId } = get()
    if (!cartId) return
    set({ isLoading: true, error: null })
    try {
      await cartAPI.clearCart(cartId)
      set({ items: [], cartCount: 0, cartId: null, isLoading: false })
    } catch (error: any) {
      set({ error: error.message || "Failed to clear cart", isLoading: false })
    }
  },
}))
export type { CartItem }
