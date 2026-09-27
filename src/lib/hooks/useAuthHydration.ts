"use client"

import { useEffect, useState } from "react"
import { refreshCart } from "@/features/cart/api/cart-queries"
import { broadcastFavoritesChanged, onFavoritesChangedElsewhere } from "@/lib/storage/favorite-products-sync"
import { onLogoutBroadcast } from "@/lib/storage/session-events"
import { bindActiveTabSync, tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"
import { useFavoriteProductsStore } from "@/stores/favoriteProductsStore"

/**
 * Hook to ensure auth state is properly hydrated from cookies
 * This fixes the issue where refresh causes authentication to be lost
 */
export function useAuthHydration() {
  const [isHydrated, setIsHydrated] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)
  const setTokens = useAuthStore((state) => state.setTokens)
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAdminImpersonating = useAuthStore((state) => state.isAdminImpersonating)

  // Mount-only: this is a one-shot restore after a hard refresh. Re-running on every auth change
  // would re-read storage right after a cross-tab `clearLocalSession()` and could undo the clear.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fallback, see comment above
  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") {
      return
    }

    if (!isAuthenticated || !user || !accessToken) {
      try {
        const cookieData = tabSessionStorage.getItem("auth-storage")
        if (cookieData) {
          let parsed = null
          try {
            parsed = JSON.parse(cookieData)
          } catch {
            // Fallback for double-encoded cookies
            const decoded = decodeURIComponent(cookieData)
            parsed = JSON.parse(decoded)
          }
          const storedState = parsed?.state

          if (storedState?.user && storedState?.accessToken) {
            // Restore user and tokens from cookie
            setUser(storedState.user)
            setTokens(storedState.accessToken, storedState.refreshToken || "")
            if (storedState.isAdminImpersonating !== undefined) {
              useAuthStore.getState().setIsAdminImpersonating(storedState.isAdminImpersonating)
            }
          }
        }
      } catch (error) {
        console.error("Error restoring auth from cookie:", error)
      }
    }

    setIsHydrated(true)
  }, [])

  // Fetch cart once authenticated (only for non-impersonating users). Keyed on the signed-in
  // user's id, not the access token: a plain token refresh (same user) must not trigger another
  // `GET /cart` - only signing in as a different account should.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberately excludes accessToken, see comment above
  useEffect(() => {
    if (isAuthenticated && accessToken && !isAdminImpersonating) {
      refreshCart()
    }
  }, [isAuthenticated, user?.id, isAdminImpersonating])

  // Keep the shared cookie pointed at this tab while it's focused, and drop this tab's session
  // locally (without touching the server or sibling tabs) if the same account logs out elsewhere.
  useEffect(() => {
    const unbindSync = bindActiveTabSync("auth-storage")
    const unbindLogout = onLogoutBroadcast((userId) => {
      const state = useAuthStore.getState()
      if (state.user?.id === userId) {
        void state.clearLocalSession()
      }
    })
    // A same-browser tab changed a favorite; re-hydrate here too, but only for the same signed-in
    // user - a different account in this tab (per-tab sessions, see `tabSessionStorage`) must
    // never adopt another account's favorites.
    const unbindFavorites = onFavoritesChangedElsewhere((userId) => {
      if (useAuthStore.getState().user?.id === userId) {
        void useFavoriteProductsStore.getState().hydrate({ force: true })
      }
    })
    // The other direction: tell this user's other same-browser tabs when a local write (toggle,
    // its rollback, setFavorite) happens here. Watches `lastLocalWriteAt`, not `ids` itself, which
    // also changes on a plain `hydrate` - that must not re-broadcast what a sibling tab just sent.
    let lastSeenWriteAt = useFavoriteProductsStore.getState().lastLocalWriteAt
    const unsubscribeFavoritesWrites = useFavoriteProductsStore.subscribe((state) => {
      if (state.lastLocalWriteAt === lastSeenWriteAt) return
      lastSeenWriteAt = state.lastLocalWriteAt
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        broadcastFavoritesChanged(userId)
      }
    })
    return () => {
      unbindSync()
      unbindLogout()
      unbindFavorites()
      unsubscribeFavoritesWrites()
    }
  }, [])

  return isHydrated
}
