import { create } from "zustand"
import { persist } from "zustand/middleware"
import { broadcastLogout } from "@/lib/storage/session-events"
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"

// Mirrors the `authFailurePromise` pattern in `src/lib/api/client.ts`: without this, calling
// `logout()` twice concurrently (e.g. `Promise.all([logout(), logout()])`) fires two
// `POST /auth/logout` requests instead of the second call simply riding the first's in-flight
// promise. Cleared in `finally` so a later, genuinely new logout is not swallowed.
let logoutPromise: Promise<void> | null = null

interface User {
  id: string
  name: string
  surname: string
  email: string
  phoneNumber: string
  emailConfirmed: boolean
  phoneNumberConfirmed: boolean
  twoFactorEnabled: boolean
  lockoutEnd: string | null
  createdDate: string
  roleName?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdminImpersonating: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setAuth: (user: User, accessToken: string, refreshToken: string, isAdminImpersonating?: boolean) => void
  setIsAdminImpersonating: (isImpersonating: boolean) => void
  clearAuth: () => void
  clearLocalSession: () => Promise<void>
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdminImpersonating: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          error: null,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),

      setAuth: (user, accessToken, refreshToken, isAdminImpersonating = false) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAdminImpersonating,
          error: null,
        }),

      setIsAdminImpersonating: (isAdminImpersonating) => set({ isAdminImpersonating }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdminImpersonating: false,
          error: null,
        }),

      clearLocalSession: async () => {
        get().clearAuth()
        // persist only rewrote an empty state; delete it so proxy.ts sees no cookie at all.
        useAuthStore.persist.clearStorage()
        // Cached server data (cart included) is dropped by QuerySessionBoundary on the user change above.

        // Clear favorite products state
        const { useFavoriteProductsStore } = await import("./favoriteProductsStore")
        useFavoriteProductsStore.getState().reset()
      },

      logout: async () => {
        if (logoutPromise) {
          return logoutPromise
        }

        logoutPromise = (async () => {
          const currentState = get()
          const userId = currentState.user?.id
          try {
            if (currentState.refreshToken && currentState.accessToken) {
              const { authAPIDirect } = await import("@/lib/api/auth-direct")
              await authAPIDirect.logout({ refreshToken: currentState.refreshToken }, currentState.accessToken)
            }
          } catch {
            // Hata olsa bile local state'i temizle
          } finally {
            await get().clearLocalSession()
            if (userId) {
              broadcastLogout(userId)
            }
            // Router push operation will be handled in components
          }
        })().finally(() => {
          logoutPromise = null
        })

        return logoutPromise
      },

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      setError: (error) =>
        set({
          error,
        }),
    }),
    {
      name: "auth-storage",
      // biome-ignore lint/suspicious/noExplicitAny: Zustand persist storage type compatibility
      storage: tabSessionStorage as any,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isAdminImpersonating: state.isAdminImpersonating,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, ensure isAuthenticated matches user presence
        if (state) {
          if (state.user && state.accessToken) {
            state.isAuthenticated = true
          } else {
            state.isAuthenticated = false
            state.isAdminImpersonating = false
          }
        }
      },
    },
  ),
)
