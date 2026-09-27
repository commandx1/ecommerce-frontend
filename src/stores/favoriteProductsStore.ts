import { create } from "zustand"
import { isAuthHandledError } from "@/lib/api/auth-error"
import { addProductFavorite, getMyFavoriteProductIds, removeProductFavorite } from "@/lib/api/favorite-products"

let inFlightHydrate: Promise<void> | null = null
// Local writes (optimistic toggles, their rollbacks, setFavorite) made while a hydrate GET is in
// flight. The GET's snapshot predates them, so replacing `ids` with it wholesale would silently
// undo a click the user made during hydration (the heart flips back even though the POST went
// through). Non-null only while a hydrate is in flight.
let writesDuringHydrate: Map<string, boolean> | null = null

interface FavoriteProductsStore {
  ids: Set<string>
  hasHydrated: boolean
  isHydrating: boolean
  hydrate: () => Promise<void>
  toggle: (productId: string) => Promise<boolean>
  setFavorite: (productId: string, value: boolean) => void
  reset: () => void
}

export const useFavoriteProductsStore = create<FavoriteProductsStore>((set, get) => {
  const writeId = (productId: string, value: boolean) => {
    writesDuringHydrate?.set(productId, value)
    set((state) => {
      const next = new Set(state.ids)
      if (value) {
        next.add(productId)
      } else {
        next.delete(productId)
      }
      return { ids: next }
    })
  }

  return {
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
      const writes = new Map<string, boolean>()
      writesDuringHydrate = writes

      inFlightHydrate = (async () => {
        try {
          const ids = new Set(await getMyFavoriteProductIds())
          // Local writes made after the GET was issued are newer than its snapshot - keep them.
          for (const [productId, value] of writes) {
            if (value) {
              ids.add(productId)
            } else {
              ids.delete(productId)
            }
          }
          set({ ids, hasHydrated: true })
        } catch (error) {
          // Never throw from hydrate: callers fire-and-forget it on mount, and an unauthenticated
          // visitor (isAuthHandledError) or a transient failure should both just leave
          // `hasHydrated` false so the next mount retries instead of crashing the page.
          if (!isAuthHandledError(error)) {
            // Swallow silently here too - there is no UI surface for a background hydrate failure.
          }
        } finally {
          // Only clear module state this run still owns - reset() (and a hydrate started after it)
          // replaces `writesDuringHydrate`, so a superseded run must not clobber the newer one.
          if (writesDuringHydrate === writes) {
            writesDuringHydrate = null
            inFlightHydrate = null
            set({ isHydrating: false })
          }
        }
      })()

      return inFlightHydrate
    },

    toggle: async (productId) => {
      const isFav = get().ids.has(productId)

      writeId(productId, !isFav)

      try {
        if (isFav) {
          await removeProductFavorite(productId)
        } else {
          await addProductFavorite(productId)
        }
      } catch (error) {
        writeId(productId, isFav)
        throw error
      }

      return !isFav
    },

    setFavorite: (productId, value) => {
      writeId(productId, value)
    },

    reset: () => {
      inFlightHydrate = null
      writesDuringHydrate = null
      set({ ids: new Set(), hasHydrated: false, isHydrating: false })
    },
  }
})

export const useIsFavoriteProduct = (productId: string): boolean =>
  useFavoriteProductsStore((s) => s.ids.has(productId))
