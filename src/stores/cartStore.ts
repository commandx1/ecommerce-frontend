import { create } from "zustand"

export interface CartItem {
  id: string
  productId: number
  quantity: number
}

interface CartStore {
  cartCount: number
  items: CartItem[]
  addToCart: (productId: string, quantity?: number) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartCount: 0,
  items: [],
  addToCart: (productId: string, quantity = 1) => {
    const existingItem = get().items.find((item) => item.productId === parseInt(productId, 10))

    if (existingItem) {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + quantity } : item,
        ),
        cartCount: state.cartCount + quantity,
      }))
    } else {
      const newItem: CartItem = {
        id: `item-${Date.now()}`,
        productId: parseInt(productId, 10),
        quantity,
      }
      set((state) => ({
        items: [...state.items, newItem],
        cartCount: state.cartCount + quantity,
      }))
    }
  },
  removeFromCart: (itemId: string) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId)
      return {
        items: state.items.filter((i) => i.id !== itemId),
        cartCount: Math.max(0, state.cartCount - (item?.quantity || 0)),
      }
    })
  },
  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(itemId)
      return
    }
    set((state) => {
      const item = state.items.find((i) => i.id === itemId)
      const oldQuantity = item?.quantity || 0
      return {
        items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        cartCount: state.cartCount - oldQuantity + quantity,
      }
    })
  },
  clearCart: () => {
    set({ cartCount: 0, items: [] })
  },
}))
