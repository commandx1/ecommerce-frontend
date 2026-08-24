import axios, { type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/stores/authStore"
import { type AuthHandledAxiosError, isAuthErrorStatus, isJwtExpired } from "./auth-error"

const apiClient = axios.create({
  baseURL: "/backend-api",
  headers: {
    "Content-Type": "application/json",
  },
})
export const appApiClient = axios.create()

let authFailurePromise: Promise<void> | null = null

const buildLoginUrl = (): string => {
  if (typeof window === "undefined") {
    return "/login"
  }

  const loginUrl = new URL("/login", window.location.origin)
  const currentPath = `${window.location.pathname}${window.location.search}`

  if (currentPath && currentPath !== "/" && !currentPath.startsWith("/login")) {
    loginUrl.searchParams.set("redirect", currentPath)
  }

  loginUrl.searchParams.set("reason", "session-expired")
  return loginUrl.toString()
}

const handleAuthFailure = async (): Promise<void> => {
  if (typeof window === "undefined") {
    return
  }

  if (!authFailurePromise) {
    authFailurePromise = (async () => {
      const { logout } = useAuthStore.getState()
      await logout()

      const target = buildLoginUrl()
      if (window.location.href !== target) {
        window.location.assign(target)
      }
    })().finally(() => {
      authFailurePromise = null
    })
  }

  await authFailurePromise
}

const resolveAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }

  const name = "auth-storage="
  const decodedCookie = decodeURIComponent(document.cookie)
  const parts = decodedCookie.split(";")

  for (let index = 0; index < parts.length; index++) {
    let cookiePart = parts[index]
    while (cookiePart.charAt(0) === " ") {
      cookiePart = cookiePart.substring(1)
    }

    if (cookiePart.indexOf(name) !== 0) {
      continue
    }

    try {
      const authData = JSON.parse(cookiePart.substring(name.length, cookiePart.length))
      return authData.state?.accessToken || null
    } catch {
      // Cookie present but unparseable (corrupted/partial value) - fall through to the
      // `localStorage` fallback below instead of returning null and silently dropping the token.
      break
    }
  }

  return localStorage.getItem("token")
}

/**
 * A 401 always means the session is gone. A 403 usually does not — it is a business-rule
 * rejection (missing role, unapproved account) on a live session and must surface inline.
 *
 * The backend, however, also answers 403 for an expired JWT: its security filter lets the
 * ExpiredJwtException escape, and with no AuthenticationEntryPoint configured Spring falls
 * back to Http403ForbiddenEntryPoint. Without this check such a user stays on the page
 * retrying forever behind a generic error toast. So a 403 counts as session expiry only when
 * the token this browser is actually holding is already past its own `exp` — which no
 * business-rule 403 ever is.
 */
const isExpiredSessionResponse = (status: number | undefined): boolean => {
  if (isAuthErrorStatus(status)) {
    return true
  }

  return status === 403 && isJwtExpired(resolveAccessToken())
}

const attachTokenInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = resolveAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

const attachAuthInterceptors = (client: typeof apiClient): void => {
  client.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error))

  client.interceptors.response.use(
    (response) => response,
    async (error: AuthHandledAxiosError) => {
      const status = error.response?.status

      if (isExpiredSessionResponse(status)) {
        error.authHandled = true
        await handleAuthFailure()
      }

      return Promise.reject(error)
    },
  )
}

attachAuthInterceptors(apiClient)
attachAuthInterceptors(appApiClient)

export default apiClient
