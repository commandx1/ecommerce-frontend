import { create } from "zustand"
import { isAuthHandledError } from "@/lib/api/auth-error"
import { addProductFavorite, getMyFavoriteProductIds, removeProductFavorite } from "@/lib/api/favorite-products"

let inFlightHydrate: Promise<void> | null = null
// Local writes (optimistic toggles, their rollbacks, setFavorite) made while a hydrate GET is in
// flight. The GET's snapshot predates them, so replacing `ids` with it wholesale would silently
// undo a click the user made during hydration (the heart flips back even though the POST went
// through). Non-null only while a hydrate is in flight.
let writesDuringHydrate: Map<string, boolean> | null = null

export interface HydrateOptions {
  /** Re-fetches even if this tab already hydrated once - the favorites page wants the current
   * server state (another device may have changed it) every time it's opened, not a stale cache. */
  force?: boolean
}

interface FavoriteProductsStore {
  ids: Set<string>
  hasHydrated: boolean
  isHydrating: boolean
  // Bumped by every local write (toggle, its rollback, setFavorite) - never by `hydrate`'s own
  // snapshot merge. `useAuthHydration` watches this (not `ids` itself, which also changes on
  // hydrate) to know when to broadcast a change to this same user's other same-browser tabs. Kept
  // here rather than importing `authStore` from this module, which would be a static import cycle
  // (`authStore.ts`'s own `resetPerUserClientState` already imports this module the other way).
  lastLocalWriteAt: number
  hydrate: (options?: HydrateOptions) => Promise<void>
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
      return { ids: next, lastLocalWriteAt: Date.now() }
    })
  }

  return {
    ids: new Set(),
    hasHydrated: false,
    isHydrating: false,
    lastLocalWriteAt: 0,

    hydrate: async (options) => {
      if (get().hasHydrated && !options?.force) {
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

          // reset() (logout / account switch) may have run while this GET was in flight and
          // already started a newer hydrate (or none at all). Either way this run no longer owns
          // `writesDuringHydrate`, so its snapshot is for a different user - write nothing.
          if (writesDuringHydrate !== writes) {
            return
          }

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
      set({ ids: new Set(), hasHydrated: false, isHydrating: false, lastLocalWriteAt: 0 })
    },
  }
})

export const useIsFavoriteProduct = (productId: string): boolean =>
  useFavoriteProductsStore((s) => s.ids.has(productId))
