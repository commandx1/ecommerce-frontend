import { create } from "zustand"
import { isAuthHandledError } from "@/lib/api/auth-error"
import { addProductFavorite, getMyFavoriteProductIds, removeProductFavorite } from "@/lib/api/favorite-products"

let inFlightHydrate: Promise<void> | null = null

interface FavoriteProductsStore {
  ids: Set<string>
  hasHydrated: boolean
  isHydrating: boolean
  hydrate: () => Promise<void>
  toggle: (productId: string) => Promise<boolean>
  setFavorite: (productId: string, value: boolean) => void
  reset: () => void
}

export const useFavoriteProductsStore = create<FavoriteProductsStore>((set, get) => ({
  ids: new Set(),
  hasHydrated: false,
  isHydrating: false,

  hydrate: async () => {
    if (get().hasHydrated) {
      return
    }

    if (inFlightHydrate) {
      return inFlightHydrate
    }

    set({ isHydrating: true })

    inFlightHydrate = (async () => {
      try {
        const ids = await getMyFavoriteProductIds()
        set({ ids: new Set(ids), hasHydrated: true })
      } catch (error) {
        // Never throw from hydrate: callers fire-and-forget it on mount, and an unauthenticated
        // visitor (isAuthHandledError) or a transient failure should both just leave
        // `hasHydrated` false so the next mount retries instead of crashing the page.
        if (!isAuthHandledError(error)) {
          // Swallow silently here too - there is no UI surface for a background hydrate failure.
        }
      } finally {
        set({ isHydrating: false })
        inFlightHydrate = null
      }
    })()

    return inFlightHydrate
  },

  toggle: async (productId) => {
    const isFav = get().ids.has(productId)

    set((state) => {
      const next = new Set(state.ids)
      if (isFav) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return { ids: next }
    })

    try {
      if (isFav) {
        await removeProductFavorite(productId)
      } else {
        await addProductFavorite(productId)
      }
    } catch (error) {
      set((state) => {
        const next = new Set(state.ids)
        if (isFav) {
          next.add(productId)
        } else {
          next.delete(productId)
        }
        return { ids: next }
      })
      throw error
    }

    return !isFav
  },

  setFavorite: (productId, value) => {
    set((state) => {
      const next = new Set(state.ids)
      if (value) {
        next.add(productId)
      } else {
        next.delete(productId)
      }
      return { ids: next }
    })
  },

  reset: () => {
    inFlightHydrate = null
    set({ ids: new Set(), hasHydrated: false, isHydrating: false })
  },
}))

export const useIsFavoriteProduct = (productId: string): boolean =>
  useFavoriteProductsStore((s) => s.ids.has(productId))
