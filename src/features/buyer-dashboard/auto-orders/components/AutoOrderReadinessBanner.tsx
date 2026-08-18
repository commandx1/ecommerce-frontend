"use client"

import Link from "next/link"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import type { AutoOrderReadiness } from "../hooks/useAutoOrders"

interface AutoOrderReadinessBannerProps {
  readiness: AutoOrderReadiness
}

export default function AutoOrderReadinessBanner({ readiness }: AutoOrderReadinessBannerProps) {
  if (readiness.isLoading || readiness.isReady) return null

  return (
    <NoticeBanner
      tone="warning"
      title="Your auto orders can't run yet"
      description="We need one more thing before we can place these orders for you automatically."
    >
      <ul className="mt-2 space-y-1.5 text-sm">
        {!readiness.hasAutoOrderCard ? (
          <li>
            <Link
              href="/buyer-dashboard/payment-methods"
              className="font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
            >
              Choose a card for auto orders
            </Link>{" "}
            — it has to allow automatic payments so we can charge it while you're away.
          </li>
        ) : null}
        {!readiness.hasPrimaryAddress ? (
          <li>
            <Link
              href="/buyer-dashboard/settings/addresses"
              className="font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
            >
              Set a primary address
            </Link>{" "}
            — repeat deliveries always ship there.
          </li>
        ) : null}
      </ul>
    </NoticeBanner>
  )
}
