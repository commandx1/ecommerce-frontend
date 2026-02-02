"use client"

import { useEffect, useState } from "react"
import { cookieStorage } from "@/lib/storage/cookie-storage"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"

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
  const fetchCart = useCartStore((state) => state.fetchCart)

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") {
      return
    }

    // Check if we need to restore from cookie
    if (!isAuthenticated || !user || !accessToken) {
      try {
        const cookieData = cookieStorage.getItem("auth-storage")
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
  }, [isAuthenticated, user, accessToken, setUser, setTokens]) // Include dependencies

  // Fetch cart once authenticated (only for non-impersonating users)
  useEffect(() => {
    if (isAuthenticated && accessToken && !isAdminImpersonating) {
      fetchCart()
    }
  }, [isAuthenticated, accessToken, isAdminImpersonating, fetchCart])

  return isHydrated
}
