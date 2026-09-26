"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  DASHBOARD_ACCESS_POLICIES,
  type DashboardRole,
  decideAfterHydration,
  decideInitialAccess,
  HYDRATION_WAIT_MS,
  readStoredSession,
} from "@/lib/auth/dashboard-access"
import { syncActiveTabCookie, tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"

const AUTH_STORAGE_KEY = "auth-storage"

/** At most this many cross-role redirects (buyer <-> vendor dashboard) per window... */
export const CROSS_ROLE_REDIRECT_LIMIT = 3
/** ...within this many milliseconds, before the guard stops bouncing and waits for the tab to be
 * focused/shown again (which re-arms it). */
export const CROSS_ROLE_REDIRECT_WINDOW_MS = 10_000

// Module-level on purpose: a buyer <-> vendor ping-pong unmounts one layout and mounts the other,
// so a per-mount ref would reset on every hop. A full page load resets it too, which is fine - a
// document request is judged by the proxy, not by this guard.
let crossRoleRedirectTimes: number[] = []

function allowCrossRoleRedirect(now: number): boolean {
  crossRoleRedirectTimes = crossRoleRedirectTimes.filter((at) => now - at < CROSS_ROLE_REDIRECT_WINDOW_MS)
  if (crossRoleRedirectTimes.length >= CROSS_ROLE_REDIRECT_LIMIT) {
    return false
  }
  crossRoleRedirectTimes.push(now)
  return true
}

/** Test-only: clears the cross-role redirect loop guard. */
export const __resetCrossRoleRedirectGuardForTests = (): void => {
  crossRoleRedirectTimes = []
}

export interface DashboardAuthGuardResult {
  /** "checking": the effect hasn't resolved yet (either this render, or waiting on the
   * `HYDRATION_WAIT_MS` timer). "authorized": render the dashboard. "unauthorized": the check
   * finished but the store is not authenticated for this role - see `unauthorizedRender` for
   * what to show while the redirect this triggered is still in flight. */
  status: "checking" | "authorized" | "unauthorized"
  unauthorizedRender: "skeleton" | "nothing"
}

/**
 * Shared auth gate for the buyer and vendor dashboard layouts. Reads THIS tab's session (never
 * the shared cookie - that is only a mirror of whichever tab wrote last, and adopting it would
 * put a sibling tab's account into this one) once per effect run; a session that already shows
 * the right role waits `HYDRATION_WAIT_MS` for the Zustand store to catch up before trusting it,
 * everything else resolves synchronously.
 *
 * Cross-tab safety (a tab can land on the wrong dashboard because the proxy judged its request
 * with a sibling tab's cookie, e.g. a background vendor tab reloaded while a buyer tab is focused):
 * - every redirect first points the shared cookie back at this tab, so the proxy judges the
 *   navigation it is about to issue by this tab's account and lets it through;
 * - the check re-runs whenever the tab is shown/focused again, so a tab whose redirect was still
 *   bounced (a sibling rewrote the cookie in between) recovers instead of sitting on a blank page;
 * - buyer <-> vendor redirects are capped (see `CROSS_ROLE_REDIRECT_LIMIT`), so a cookie that
 *   keeps flipping can never turn into an endless push loop.
 */
export function useDashboardAuthGuard(role: DashboardRole): DashboardAuthGuardResult {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [recheck, setRecheck] = useState(0)
  const wasAuthenticatedRef = useRef(false)
  const policy = DASHBOARD_ACCESS_POLICIES[role]

  // Render-time, not effect-time: tracks whether this mount has EVER seen an authenticated
  // store, so a later logout still redirects a buyer to "/" instead of "/login".
  if (isAuthenticated && user) {
    wasAuthenticatedRef.current = true
  }

  // Re-check when the tab comes (back) into view. The user looking at the tab is also what re-arms
  // the cross-role loop guard.
  useEffect(() => {
    const onShown = () => {
      if (document.visibilityState !== "visible") return
      crossRoleRedirectTimes = []
      setRecheck((n) => n + 1)
    }
    window.addEventListener("focus", onShown)
    document.addEventListener("visibilitychange", onShown)
    return () => {
      window.removeEventListener("focus", onShown)
      document.removeEventListener("visibilitychange", onShown)
    }
  }, [])

  // `policy` is a stable per-role constant, so omitting it changes nothing. `recheck` has no value
  // of its own; it only re-runs the check (see the listener above).
  // biome-ignore lint/correctness/useExhaustiveDependencies: policy is stable per role, recheck is a trigger
  useEffect(() => {
    const leaveTo = (to: string) => {
      // The proxy decides by the shared cookie, which may currently hold a sibling tab's account;
      // point it at this tab (or clear it, for a signed-out tab) right before the request leaves.
      syncActiveTabCookie(AUTH_STORAGE_KEY)
      if (to === policy.crossRoleTarget && !allowCrossRoleRedirect(Date.now())) {
        return
      }
      router.push(to)
    }

    let raw: string | null
    try {
      raw = tabSessionStorage.getItem(AUTH_STORAGE_KEY)
    } catch {
      raw = null
    }

    const stored = readStoredSession(raw, policy)
    const decision = decideInitialAccess(policy, stored, { user, isAuthenticated }, wasAuthenticatedRef.current)

    if (decision.kind === "redirect") {
      leaveTo(decision.to)
      return
    }

    if (decision.kind === "allow") {
      setIsChecking(false)
      return
    }

    // decision.kind === "await-hydration". Cleared on cleanup: otherwise a store change inside
    // the wait (e.g. a logout) leaves this timer to push a second, stale redirect on top of the
    // one the re-run already issued.
    const timer = setTimeout(() => {
      const after = decideAfterHydration(policy, useAuthStore.getState().user, wasAuthenticatedRef.current)
      if (after.kind === "redirect") {
        leaveTo(after.to)
      } else {
        setIsChecking(false)
      }
    }, HYDRATION_WAIT_MS)

    return () => clearTimeout(timer)
  }, [user, isAuthenticated, router, recheck])

  if (isChecking) {
    return { status: "checking", unauthorizedRender: policy.unauthorizedRender }
  }

  const isAuthorizedNow = isAuthenticated && Boolean(user) && policy.isAllowedRole(user?.roleName)
  if (!isAuthorizedNow) {
    return { status: "unauthorized", unauthorizedRender: policy.unauthorizedRender }
  }

  return { status: "authorized", unauthorizedRender: policy.unauthorizedRender }
}
