"use client"

import { CheckCircle2, Loader2, Repeat } from "lucide-react"
import Link from "next/link"
import type { AutoOrderRegistrationState } from "@/features/checkout/hooks/useAutoOrderRegistration"

const manageLink = (
  <Link
    href="/buyer-dashboard/auto-orders"
    className="font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
  >
    Auto Orders
  </Link>
)

export default function OrderConfirmationAutoOrderNotice({
  status,
  registeredCount,
  expectedCount,
}: AutoOrderRegistrationState) {
  if (status === "none" || expectedCount === 0) return null

  const itemWord = expectedCount > 1 ? "items" : "item"

  return (
    <div className="mb-8 flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/5 p-4">
      {status === "ready" ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
      ) : status === "pending" ? (
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-brand" />
      ) : (
        <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
      )}

      <p className="text-sm text-text-secondary">
        {status === "ready" ? (
          <>
            <span className="font-semibold text-text-primary">
              {expectedCount} {itemWord} will be reordered automatically.
            </span>{" "}
            Change the quantity, pause or cancel anytime in {manageLink}.
          </>
        ) : status === "pending" ? (
          <>
            <span className="font-semibold text-text-primary">
              Setting up automatic reordering for {expectedCount} {itemWord}…
            </span>{" "}
            We're waiting for your payment to be fully confirmed
            {registeredCount > 0 ? ` (${registeredCount} of ${expectedCount} ready)` : ""}. You can leave this page —
            nothing is lost.
          </>
        ) : (
          <>
            <span className="font-semibold text-text-primary">
              Your {itemWord} {expectedCount > 1 ? "are" : "is"} still being set up for automatic reordering.
            </span>{" "}
            This is taking longer than usual. Check {manageLink} in a few minutes; if it's still missing, contact
            support.
          </>
        )}
      </p>
    </div>
  )
}
