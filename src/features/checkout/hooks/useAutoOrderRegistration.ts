"use client"

import { useEffect, useRef, useState } from "react"
import { autoOrdersAPI } from "@/lib/api/auto-orders"
import { useCheckoutStore } from "@/stores/checkoutStore"

const POLL_INTERVAL_MS = 3000
/** ~90s of waiting; past that the schedules are still coming, just not worth blocking the UI for. */
const MAX_ATTEMPTS = 30

export type AutoOrderRegistrationStatus = "none" | "pending" | "ready" | "timeout"

export interface AutoOrderRegistrationState {
  status: AutoOrderRegistrationStatus
  /** How many of the expected schedules exist so far. */
  registeredCount: number
  expectedCount: number
}

/**
 * Auto orders are only written once Stripe's `payment_intent.succeeded` webhook
 * lands, which happens after the shipping labels are bought and the payment is
 * captured — so they are not there the moment checkout returns. Rather than
 * guessing how long that takes, poll `GET /auto-orders` until the schedules the
 * buyer just set up show up.
 */
export function useAutoOrderRegistration(): AutoOrderRegistrationState {
  const expectedIds = useCheckoutStore((state) => state.autoOrderUserProductIds)
  const [registeredCount, setRegisteredCount] = useState(0)
  const [status, setStatus] = useState<AutoOrderRegistrationStatus>(expectedIds.length > 0 ? "pending" : "none")

  // Read inside the effect without making it a dependency, so a new array
  // identity from the store cannot restart the poll loop mid-flight.
  const expectedIdsRef = useRef(expectedIds)
  expectedIdsRef.current = expectedIds

  const expectedCount = expectedIds.length

  useEffect(() => {
    if (expectedCount === 0) {
      setStatus("none")
      return
    }

    let isCancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let attempts = 0

    const poll = async () => {
      attempts += 1

      try {
        const response = await autoOrdersAPI.getAutoOrders()
        if (isCancelled) return

        const liveIds = new Set(response.autoOrders.map((autoOrder) => autoOrder.userProductId))
        const found = expectedIdsRef.current.filter((id) => liveIds.has(id)).length
        setRegisteredCount(found)

        if (found >= expectedIdsRef.current.length) {
          setStatus("ready")
          return
        }
      } catch {
        // A failed poll is not worth surfacing — the schedules are created by the
        // backend regardless, so just try again until we run out of attempts.
        if (isCancelled) return
      }

      if (attempts >= MAX_ATTEMPTS) {
        setStatus("timeout")
        return
      }

      timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
    }

    setStatus("pending")
    timeoutId = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      isCancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [expectedCount])

  return { status, registeredCount, expectedCount }
}
