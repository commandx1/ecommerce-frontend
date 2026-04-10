import axios, { type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/stores/authStore"
import { type AuthErrorStatus, type AuthHandledAxiosError, isAuthErrorStatus } from "./auth-error"

const apiClient = axios.create({
  baseURL: "/backend-api",
  headers: {
    "Content-Type": "application/json",
  },
})
export const appApiClient = axios.create()

let authFailurePromise: Promise<void> | null = null

const buildLoginUrl = (status: AuthErrorStatus): string => {
  if (typeof window === "undefined") {
    return "/login"
  }

  const loginUrl = new URL("/login", window.location.origin)
  const currentPath = `${window.location.pathname}${window.location.search}`

  if (currentPath && currentPath !== "/" && !currentPath.startsWith("/login")) {
    loginUrl.searchParams.set("redirect", currentPath)
  }

  loginUrl.searchParams.set("reason", status === 401 ? "session-expired" : "access-denied")
  return loginUrl.toString()
}

const handleAuthFailure = async (status: AuthErrorStatus): Promise<void> => {
  if (typeof window === "undefined") {
    return
  }

  if (!authFailurePromise) {
    authFailurePromise = (async () => {
      const { logout } = useAuthStore.getState()
      await logout()

      const target = buildLoginUrl(status)
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
      return null
    }
  }

  return localStorage.getItem("token")
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

      if (isAuthErrorStatus(status)) {
        error.authHandled = true
        await handleAuthFailure(status)
      }

      return Promise.reject(error)
    },
  )
}

attachAuthInterceptors(apiClient)
attachAuthInterceptors(appApiClient)

export default apiClient
