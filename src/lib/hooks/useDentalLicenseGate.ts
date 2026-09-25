"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { licenseAPI } from "@/lib/api/licenses"
import { type DentalLicenseStatus, getRejectionReason, resolveDentalLicenseStatus } from "@/lib/helpers/dentalLicense"

interface DentalLicenseCheckResult {
  status: DentalLicenseStatus | null
  checkFailed: boolean
}

interface UseDentalLicenseGateResult extends DentalLicenseCheckResult {
  isChecking: boolean
  rejectionReason: string | null
  /**
   * Awaits the in-flight (or a fresh) licence lookup and resolves with the SETTLED result. A click
   * handler must await this: render state can still hold its initial "not yet checked" value.
   */
  ensureChecked: () => Promise<DentalLicenseCheckResult>
}

/**
 * Shared licence lookup for both the cart gate and the checkout guard. Fetches once on mount,
 * fails closed (status: null, checkFailed: true) on error, and exposes `ensureChecked` so a
 * caller can await the SAME request rather than trusting whatever render state happens to hold.
 */
export function useDentalLicenseGate(): UseDentalLicenseGateResult {
  const [status, setStatus] = useState<DentalLicenseStatus | null>(null)
  const [checkFailed, setCheckFailed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

  const isMountedRef = useRef(true)
  const requestRef = useRef<Promise<DentalLicenseCheckResult> | null>(null)

  const runCheck = useCallback((): Promise<DentalLicenseCheckResult> => {
    const request = licenseAPI
      .getLicenses()
      .then((licenses): DentalLicenseCheckResult => {
        const resolvedStatus = resolveDentalLicenseStatus(licenses)
        if (isMountedRef.current) {
          setStatus(resolvedStatus)
          setCheckFailed(false)
          setRejectionReason(resolvedStatus === "rejected" ? getRejectionReason(licenses) : null)
          setIsChecking(false)
        }
        return { status: resolvedStatus, checkFailed: false }
      })
      .catch((): DentalLicenseCheckResult => {
        // Drop the cached promise so the next `ensureChecked` actually retries. Both the banner
        // and the toast tell a buyer to "try again in a moment"; keeping a settled failure in the
        // ref would make every later click replay that same failure until a full page reload.
        requestRef.current = null
        // Fail closed: an unverified licence must never read as "valid" downstream.
        if (isMountedRef.current) {
          setStatus(null)
          setCheckFailed(true)
          setRejectionReason(null)
          setIsChecking(false)
        }
        return { status: null, checkFailed: true }
      })

    requestRef.current = request
    return request
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    void runCheck()

    return () => {
      isMountedRef.current = false
    }
    // `runCheck` is stable (its own `useCallback` has an empty dep array), so listing it here
    // still leaves this effect firing exactly once on mount — re-fetching on every render would
    // defeat the point of caching the in-flight promise below.
  }, [runCheck])

  const ensureChecked = useCallback((): Promise<DentalLicenseCheckResult> => {
    return requestRef.current ?? runCheck()
  }, [runCheck])

  return { status, checkFailed, isChecking, rejectionReason, ensureChecked }
}
