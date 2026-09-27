import { create } from "zustand"
import { persist } from "zustand/middleware"
import { broadcastLogout } from "@/lib/storage/session-events"
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"

// Mirrors the `authFailurePromise` pattern in `src/lib/api/client.ts`: without this, calling
// `logout()` twice concurrently (e.g. `Promise.all([logout(), logout()])`) fires two
// `POST /auth/logout` requests instead of the second call simply riding the first's in-flight
// promise. Cleared in `finally` so a later, genuinely new logout is not swallowed.
let logoutPromise: Promise<void> | null = null

/**
 * Every zustand store that holds per-user data outside `authStore` itself. Reset from both
 * `clearLocalSession` (logout) and `setAuth` (login-over-an-existing-session, e.g. /login,
 * /verify-2fa, /verify-email reached while already authenticated) so account A's checkout draft
 * (including a tokenized-but-not-yet-charged card) or favorites can never carry over into account
 * B's session in the same tab. `QuerySessionBoundary` covers the React Query cache separately -
 * this covers the stores it does not know about.
 */
async function resetPerUserClientState(): Promise<void> {
  const [{ useCheckoutStore }, { useFavoriteProductsStore }] = await Promise.all([
    import("./checkoutStore"),
    import("./favoriteProductsStore"),
  ])
  useCheckoutStore.getState().reset()
  useFavoriteProductsStore.getState().reset()
}

/**
 * Best-effort revocation of the session `setAuth` is about to overwrite, for the
 * login-over-an-existing-session case (a different user authenticates in a tab that still holds
 * account A's tokens). Deliberately a raw `fetch`, not `authAPIDirect.logout` (which goes through
 * `apiClient`): that client's request interceptor always stamps the *current* live access token
 * onto outgoing requests, and by the time this fire-and-forget call reaches the network `setAuth`
 * has already made B's token the live one - `apiClient` would send A's refresh token with B's
 * bearer token instead of A's own. Must never throw or block B's login - A's refresh token
 * outliving this call just means it expires normally instead of being revoked early.
 */
function revokePreviousSession(accessToken: string, refreshToken: string): void {
  void fetch("/backend-api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {
    // Best-effort: B's login must proceed regardless.
  })
}

export interface User {
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

      setAuth: (user, accessToken, refreshToken, isAdminImpersonating = false) => {
        const previous = get()
        // A different identity was signed in in this tab (login-over-session: /login, /verify-2fa,
        // /verify-email reached while already authenticated). Same-user re-`setAuth` (token refresh,
        // 2FA completing the same login) must NOT match this - it would wipe an in-progress checkout.
        const isIdentitySwitch = previous.user !== null && previous.user.id !== user.id

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAdminImpersonating,
          error: null,
        })

        if (isIdentitySwitch) {
          void resetPerUserClientState()
          if (previous.accessToken && previous.refreshToken) {
            revokePreviousSession(previous.accessToken, previous.refreshToken)
          }
        }
      },

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

        await resetPerUserClientState()
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
