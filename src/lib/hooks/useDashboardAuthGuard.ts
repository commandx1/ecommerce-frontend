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
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"

const AUTH_STORAGE_KEY = "auth-storage"

export interface DashboardAuthGuardResult {
  /** "checking": the effect hasn't resolved yet (either this render, or waiting on the
   * `HYDRATION_WAIT_MS` timer). "authorized": render the dashboard. "unauthorized": the check
   * finished but the store is not authenticated for this role - see `unauthorizedRender` for
   * what to show while the redirect this triggered is still in flight. */
  status: "checking" | "authorized" | "unauthorized"
  unauthorizedRender: "skeleton" | "nothing"
}

/**
 * Extracted from `app/{buyer,vendor}-dashboard/layout.tsx` (Phase 4 design doc §4.2/G2).
 * Behaviour is unchanged from before the extraction - see both layouts' `layout.test.tsx`
 * (written against the pre-extraction code and left unmodified) for the oracle. Reads the
 * `auth-storage` cookie once per effect run; a cookie that already shows the right role waits
 * `HYDRATION_WAIT_MS` for the Zustand store to catch up before trusting it, everything else
 * resolves synchronously off the store.
 */
export function useDashboardAuthGuard(role: DashboardRole): DashboardAuthGuardResult {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const wasAuthenticatedRef = useRef(false)
  const policy = DASHBOARD_ACCESS_POLICIES[role]

  // Render-time, not effect-time (Phase 4 §4.1): tracks whether this mount has EVER seen an
  // authenticated store, so a later logout still redirects a buyer to "/" instead of "/login".
  if (isAuthenticated && user) {
    wasAuthenticatedRef.current = true
  }

  // `policy` is a stable per-role constant (not per-render), so omitting it changes nothing;
  // deps are pinned to `[user, isAuthenticated, router]` to match the pre-extraction effect
  // exactly (see G1's layout.test.tsx).
  // biome-ignore lint/correctness/useExhaustiveDependencies: policy is stable per role, see above
  useEffect(() => {
    let raw: string | null
    try {
      raw = tabSessionStorage.getItem(AUTH_STORAGE_KEY)
    } catch {
      raw = null
    }

    const stored = readStoredSession(raw, policy)
    const decision = decideInitialAccess(policy, stored, { user, isAuthenticated }, wasAuthenticatedRef.current)

    if (decision.kind === "redirect") {
      router.push(decision.to)
      return
    }

    if (decision.kind === "allow") {
      setIsChecking(false)
      return
    }

    // decision.kind === "await-hydration"
    setTimeout(() => {
      const after = decideAfterHydration(policy, useAuthStore.getState().user, wasAuthenticatedRef.current)
      if (after.kind === "redirect") {
        router.push(after.to)
      } else {
        setIsChecking(false)
      }
    }, HYDRATION_WAIT_MS)
  }, [user, isAuthenticated, router])

  if (isChecking) {
    return { status: "checking", unauthorizedRender: policy.unauthorizedRender }
  }

  const isAuthorizedNow = isAuthenticated && Boolean(user) && policy.isAllowedRole(user?.roleName)
  if (!isAuthorizedNow) {
    return { status: "unauthorized", unauthorizedRender: policy.unauthorizedRender }
  }

  return { status: "authorized", unauthorizedRender: policy.unauthorizedRender }
}
