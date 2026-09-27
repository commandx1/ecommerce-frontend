/**
 * Pure access-decision table for the buyer/vendor dashboard guards: "read the cookie first, wait
 * for the store to hydrate, then decide". No React, router or storage; `useDashboardAuthGuard` is
 * the only caller (`src/proxy.ts` only shares `RETURN_TO_PARAM`).
 */

import { safeRedirect } from "@/lib/utils/safe-redirect"

export type DashboardRole = "buyer" | "vendor"

/** How long the guard waits for the auth store to hydrate before re-checking it, once the
 * cookie itself says the tab is authenticated with the right role. */
export const HYDRATION_WAIT_MS = 100

export interface DashboardAccessPolicy {
  isAllowedRole(roleName: string | undefined): boolean
  /** Where a wrong-role session (cookie or store) is sent. */
  crossRoleTarget: string
  /** Where a tab with no usable cookie AND an unauthenticated store is sent. */
  unauthenticatedTarget(wasAuthenticated: boolean): string
  /** Where a tab is sent when the cookie promised a session but the store still has no user after
   * the hydration wait. Vendor always bounces to the buyer dashboard here (existing quirk). */
  hydrationMissingUserTarget(wasAuthenticated: boolean): string
  /** Vendor's layout retries a `JSON.parse` failure with `decodeURIComponent`; buyer does not. */
  decodeUriCookieFallback: boolean
  /** What an unauthorized (checked, but not allowed) render shows. */
  unauthorizedRender: "skeleton" | "nothing"
}

export const DASHBOARD_ACCESS_POLICIES: Record<DashboardRole, DashboardAccessPolicy> = {
  buyer: {
    isAllowedRole: (roleName) => roleName !== "Vendor",
    crossRoleTarget: "/vendor-dashboard",
    unauthenticatedTarget: (wasAuthenticated) => (wasAuthenticated ? "/" : "/login"),
    hydrationMissingUserTarget: (wasAuthenticated) => (wasAuthenticated ? "/" : "/login"),
    decodeUriCookieFallback: false,
    unauthorizedRender: "skeleton",
  },
  vendor: {
    isAllowedRole: (roleName) => roleName === "Vendor",
    crossRoleTarget: "/buyer-dashboard",
    unauthenticatedTarget: () => "/login",
    hydrationMissingUserTarget: () => "/buyer-dashboard",
    decodeUriCookieFallback: true,
    unauthorizedRender: "nothing",
  },
}

interface StoredSessionUser {
  roleName?: string
}

export interface StoredSession {
  user: StoredSessionUser
  isAuthenticated: boolean
}

/**
 * Parses the raw `auth-storage` string but never throws: a malformed value (or one with neither a
 * user nor `isAuthenticated`) comes back as `null`.
 */
export function readStoredSession(raw: string | null, policy: DashboardAccessPolicy): StoredSession | null {
  if (!raw) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    if (!policy.decodeUriCookieFallback) {
      return null
    }
    try {
      parsed = JSON.parse(decodeURIComponent(raw))
    } catch {
      return null
    }
  }

  const state = (parsed as { state?: { user?: StoredSessionUser; isAuthenticated?: boolean } } | null)?.state
  const user = state?.user
  const isAuthenticated = state?.isAuthenticated

  if (!user || !isAuthenticated) {
    return null
  }

  return { user, isAuthenticated }
}

export type AccessDecision = { kind: "redirect"; to: string } | { kind: "await-hydration" } | { kind: "allow" }

/**
 * The synchronous half of `checkAuth`: what to do the instant the effect runs, before any
 * `setTimeout`. A stored (cookie) session with the right role always defers to hydration - the
 * store might not have caught up yet - everything else (no usable cookie, or a stored session
 * with the wrong role) resolves immediately.
 */
export function decideInitialAccess(
  policy: DashboardAccessPolicy,
  stored: StoredSession | null,
  store: { user: StoredSessionUser | null; isAuthenticated: boolean },
  wasAuthenticated: boolean,
): AccessDecision {
  if (stored) {
    if (!policy.isAllowedRole(stored.user.roleName)) {
      return { kind: "redirect", to: policy.crossRoleTarget }
    }
    return { kind: "await-hydration" }
  }

  if (!store.isAuthenticated || !store.user) {
    return { kind: "redirect", to: policy.unauthenticatedTarget(wasAuthenticated) }
  }
  if (!policy.isAllowedRole(store.user.roleName)) {
    return { kind: "redirect", to: policy.crossRoleTarget }
  }
  return { kind: "allow" }
}

/** The `setTimeout(..., HYDRATION_WAIT_MS)` callback's decision, reading the store fresh. */
export function decideAfterHydration(
  policy: DashboardAccessPolicy,
  currentUser: StoredSessionUser | null,
  wasAuthenticated: boolean,
): Exclude<AccessDecision, { kind: "await-hydration" }> {
  if (!currentUser) {
    return { kind: "redirect", to: policy.hydrationMissingUserTarget(wasAuthenticated) }
  }
  if (!policy.isAllowedRole(currentUser.roleName)) {
    return { kind: "redirect", to: policy.crossRoleTarget }
  }
  return { kind: "allow" }
}

/**
 * Query param `src/proxy.ts` adds when it bounces a dashboard request to the OTHER dashboard
 * because the shared cookie holds a sibling tab's account: the internal path + query the tab
 * originally asked for. The guard that then recovers the tab sends it back there instead of to the
 * dashboard root.
 */
export const RETURN_TO_PARAM = "returnTo"

/** Longer values are ignored outright (no internal dashboard URL comes anywhere near this). */
export const RETURN_TO_MAX_LENGTH = 2048

/**
 * Where a tab recovering from a role mismatch should go, given the raw `returnTo` value as read
 * from the URL (i.e. decoded exactly once), or `null` to fall back to `policy.crossRoleTarget`.
 *
 * The recovering guard is the one mounted on the WRONG dashboard, so the only acceptable target is
 * inside its `crossRoleTarget` area (the tab's own dashboard). Open-redirect safety is delegated to
 * `safeRedirect` (the same validator as the login `?redirect=`); its parsed, normalised result is
 * what gets area-checked and returned, and its "/" fallback never passes the area check.
 */
export function resolveCrossRoleReturnTo(policy: DashboardAccessPolicy, raw: string | null): string | null {
  if (!raw || raw.length > RETURN_TO_MAX_LENGTH) {
    return null
  }

  const target = safeRedirect(raw)
  const pathname = target.split(/[?#]/, 1)[0] ?? ""
  const area = policy.crossRoleTarget
  if (pathname !== area && !pathname.startsWith(`${area}/`)) {
    return null
  }
  return target
}
