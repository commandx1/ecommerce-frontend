import { create } from "zustand"
import { persist } from "zustand/middleware"
import { cookieStorage } from "@/lib/storage/cookie-storage"

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

      logout: async () => {
        const currentState = get()
        try {
          if (currentState.refreshToken && currentState.accessToken) {
            const { authAPIDirect } = await import("@/lib/api/auth-direct")
            await authAPIDirect.logout({ refreshToken: currentState.refreshToken }, currentState.accessToken)
          }
        } catch {
          // Hata olsa bile local state'i temizle
        } finally {
          // Clear auth state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isAdminImpersonating: false,
            error: null,
          })

          // Clear cart state
          const { useCartStore } = await import("./cartStore")
          useCartStore.getState().resetCart()

          // Router push operation will be handled in components
        }
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
      storage: cookieStorage as any,
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
