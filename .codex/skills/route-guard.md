---
name: route-guard
description: Protect routes in Next.js App Router using middleware for server-side redirection and AuthGuard for client-side layout protection — never check auth inside individual page components
---

# Workflow

## 1. Decide which layer handles the guard

Next.js has two places to protect routes. Use both together — they serve different purposes:

| Layer                 | What it does                                                          | When it runs                  |
| --------------------- | --------------------------------------------------------------------- | ----------------------------- |
| `middleware.ts`       | Redirects unauthenticated requests before the page renders            | Server-side, on every request |
| `AuthGuard` component | Protects layout, shows loading state, handles token expiry at runtime | Client-side, after hydration  |

Never rely on only one. Middleware is the first line of defense. `AuthGuard` handles runtime session expiry and role-based access that middleware cannot check.

Never check auth inside `page.tsx` — always in middleware or layout-level `AuthGuard`.

## 2. middleware.ts — server-side redirect

```ts
// middleware.ts (root of project, next to app/)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"]
const AUTH_ROUTES = ["/login", "/register"] // redirect away if already logged in

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // Authenticated user trying to access login/register → send to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Unauthenticated user trying to access protected route → send to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname) // preserve intended destination
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run middleware on all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
```

Rules:

- Token is read from cookies, not localStorage — middleware runs on the server and has no access to localStorage
- Always preserve the intended destination in `?redirect=` param so the user lands where they were going after login
- Always define `matcher` to exclude static files — running middleware on every asset request is wasteful
- Middleware only checks token existence — it does not validate the token signature (that is AuthGuard's job)

## 3. Redirect after login

Read the `redirect` param and navigate there after successful login:

```ts
// features/auth/hooks/useLogin.ts
import { useRouter, useSearchParams } from "next/navigation"

export const useLogin = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const login = async (data: LoginFormData) => {
    try {
      const { token } = await authService.login(data)
      setCookie("token", token) // must be a cookie, not localStorage
      const redirect = searchParams.get("redirect") ?? "/dashboard"
      router.replace(redirect)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast.error("Login failed", err.response?.data?.message ?? err.message)
      }
    }
  }

  return { login }
}
```

Rules:

- Store token in a cookie, not localStorage — middleware cannot read localStorage
- Use `router.replace()` after login, not `router.push()` — so the login page is not in browser history
- Validate the redirect destination is an internal path — never redirect to an external URL from the `redirect` param

## 4. AuthGuard — client-side layout protection

`AuthGuard` sits in the dashboard `layout.tsx`. It handles runtime token validation and role-based access that middleware cannot do.

```tsx
// components/auth/AuthGuard.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, selectToken, selectUser } from "@/store/useAuthStore"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "staff" | "viewer"
}

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const router = useRouter()
  const token = useAuthStore(selectToken)
  const user = useAuthStore(selectUser)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (!isHydrated) return

    if (!token) {
      router.replace("/login")
      return
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace("/unauthorized")
    }
  }, [token, user, isHydrated, requiredRole, router])

  // Do not render children until hydration is confirmed
  if (!isHydrated || !token) return null

  if (requiredRole && user?.role !== requiredRole) return null

  return <>{children}</>
}
```

Rules:

- Never render children before hydration is confirmed — causes flash of protected content
- `isHydrated` flag prevents redirect on first render before Zustand loads from storage
- Return `null` while loading — do not render a spinner inside `AuthGuard`, use a layout-level `loading.tsx` instead
- Role check is optional — pass `requiredRole` only when the layout section requires it

## 5. isHydrated flag in auth store

```ts
// store/useAuthStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  token: string | null
  user: User | null
  isHydrated: boolean
}

interface AuthActions {
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  setHydrated: () => void
}

const initialState: AuthState = {
  token: null,
  user: null,
  isHydrated: false,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setHydrated: () => set({ isHydrated: true }),
      logout: () => set(initialState),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated() // fires once persist has loaded from storage
      },
    },
  ),
)

export const selectToken = (s: AuthState & AuthActions) => s.token
export const selectUser = (s: AuthState & AuthActions) => s.user
```

## 6. Unauthorized page

Always have a dedicated `/unauthorized` page — never redirect to login for role failures.

```tsx
// app/unauthorized/page.tsx
import Link from "next/link"
import { ShieldOff } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <ShieldOff className="w-10 h-10 text-gray-400" />
      <h1 className="text-xl font-semibold text-gray-700">Access Denied</h1>
      <p className="text-gray-400 text-sm">You do not have permission to view this page.</p>
      <Link href="/dashboard" className="text-steel-blue text-sm hover:underline">
        Back to Dashboard
      </Link>
    </div>
  )
}
```

## 7. Folder structure

```
middleware.ts                          → root of project

app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx                    → <AuthGuard>{children}</AuthGuard>
│   └── ...pages
└── unauthorized/
    └── page.tsx

components/auth/
└── AuthGuard.tsx

store/
└── useAuthStore.ts                   → token, user, isHydrated, logout
```

## 8. Logout

Logout clears the cookie, resets all stores, and redirects to login.

```ts
// features/auth/hooks/useLogout.ts
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { useClaimsStore } from "@/store/useClaimsStore"
import { deleteCookie } from "@/lib/cookies"

export const useLogout = () => {
  const router = useRouter()
  const logoutAuth = useAuthStore((s) => s.logout)

  const logout = () => {
    deleteCookie("token")
    logoutAuth() // resets auth store
    useClaimsStore.getState().reset() // resets other stores
    router.replace("/login")
  }

  return { logout }
}
```

Rules:

- Delete the cookie first, then reset stores, then redirect — in that order
- Use `router.replace()` — login page must not appear in browser history after logout
- Reset all domain stores on logout — not just auth store

## 9. Checklist

- [ ] `middleware.ts` exists at project root with correct `matcher` config
- [ ] Token stored in cookie, not localStorage
- [ ] `?redirect=` param preserved on unauthenticated redirect
- [ ] `router.replace()` used after login and logout — never `router.push()`
- [ ] `AuthGuard` in dashboard `layout.tsx` — never in individual pages
- [ ] Children not rendered until `isHydrated` is true — no flash of protected content
- [ ] `isHydrated` flag in auth store set via `onRehydrateStorage`
- [ ] Role-based access uses `requiredRole` prop on `AuthGuard`
- [ ] `/unauthorized` page exists for role failures — not redirected to login
- [ ] Logout clears cookie + resets all stores + `router.replace("/login")`
