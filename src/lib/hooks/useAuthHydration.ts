"use client"

import { useEffect, useState } from "react"
import { refreshCart } from "@/features/cart/api/cart-queries"
import { onLogoutBroadcast } from "@/lib/storage/session-events"
import { bindActiveTabSync, tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"

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

    // Check if we need to restore from cookie
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

  // Fetch cart once authenticated (only for non-impersonating users)
  useEffect(() => {
    if (isAuthenticated && accessToken && !isAdminImpersonating) {
      refreshCart()
    }
  }, [isAuthenticated, accessToken, isAdminImpersonating])

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
    return () => {
      unbindSync()
      unbindLogout()
    }
  }, [])

  return isHydrated
}
