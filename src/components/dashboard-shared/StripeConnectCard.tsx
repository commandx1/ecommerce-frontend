"use client"

import { BadgeCheck, CreditCard, ExternalLink, ShieldAlert } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/ui/Toast"
import {
  createStripeAccountLink,
  getStripeConnectStatus,
  getStripeLoginLink,
  type StripeConnectStatus,
} from "@/lib/api/stripe-connect"
import { cn } from "@/lib/utils"

type CardState = { kind: "loading" } | { kind: "ready"; status: StripeConnectStatus } | { kind: "unavailable" }

export default function StripeConnectCard() {
  const [state, setState] = useState<CardState>({ kind: "loading" })
  const [isWorking, setIsWorking] = useState(false)

  const loadStatus = useCallback(async () => {
    setState({ kind: "loading" })

    try {
      setState({ kind: "ready", status: await getStripeConnectStatus() })
    } catch {
      // The backend rejects users without a company, so treat any failure as "not set up yet".
      setState({ kind: "unavailable" })
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleStartOnboarding = async () => {
    setIsWorking(true)

    try {
      const { onboardingUrl } = await createStripeAccountLink()
      window.location.assign(onboardingUrl)
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Failed to start payout account setup.")
      setIsWorking(false)
    }
  }

  const handleOpenDashboard = async () => {
    setIsWorking(true)

    try {
      const { url } = await getStripeLoginLink()
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Failed to open the Stripe dashboard.")
    } finally {
      setIsWorking(false)
    }
  }

  const status = state.kind === "ready" ? state.status : null
  const isEnabled = Boolean(status?.enabled)
  const isIncomplete = Boolean(status?.connected) && !isEnabled

  return (
    <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <CreditCard className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold text-text-primary">Payouts</h2>
        </div>

        {status && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              isEnabled ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
            )}
          >
            {isEnabled ? <BadgeCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {isEnabled ? "Active" : isIncomplete ? "Setup incomplete" : "Not connected"}
          </span>
        )}
      </div>

      {state.kind === "loading" && <p className="p-6 text-sm text-text-muted">Loading payout account...</p>}

      {state.kind === "unavailable" && (
        <p className="p-6 text-sm text-text-muted">Payout account information is not available for this account.</p>
      )}

      {status && (
        <div className="space-y-4 p-6">
          <p className="text-sm text-text-secondary">
            {isEnabled
              ? "Your Stripe account is connected and receiving payouts for your orders."
              : isIncomplete
                ? "Your Stripe account was created but onboarding is not finished yet. You won't receive payouts until it is complete."
                : "Connect a Stripe account to receive payouts for the orders you fulfill."}
          </p>

          {status.stripeAccountId && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Stripe account</span>
              <span className="font-mono text-text-secondary">{status.stripeAccountId}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border-soft pt-4">
            {isEnabled ? (
              <Button type="button" variant="outline" onClick={handleOpenDashboard} disabled={isWorking}>
                <ExternalLink className="h-4 w-4" />
                {isWorking ? "Opening..." : "Open Stripe dashboard"}
              </Button>
            ) : (
              <Button type="button" onClick={handleStartOnboarding} disabled={isWorking}>
                <ExternalLink className="h-4 w-4" />
                {isWorking ? "Redirecting..." : isIncomplete ? "Continue setup" : "Set up payouts"}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
