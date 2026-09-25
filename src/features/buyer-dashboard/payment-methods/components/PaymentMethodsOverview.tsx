import { CheckCircle2, CreditCard, Plus, Repeat } from "lucide-react"
import Link from "next/link"
import type React from "react"
import SectionHeading from "@/components/layout/SectionHeading"
import { Button } from "@/components/ui/button"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { SavedPaymentMethod } from "../paymentMethodsData"

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: React.ReactNode
}) {
  return (
    <article className={cn("rounded-xl border border-border-soft bg-surface p-4")}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </article>
  )
}

export default function PaymentMethodsOverview({
  isLoading,
  methodCount,
  defaultMethod,
  autoOrderMethod,
  onAddCard,
}: {
  isLoading: boolean
  methodCount: number
  defaultMethod: SavedPaymentMethod | null
  autoOrderMethod: SavedPaymentMethod | null
  onAddCard: () => void
}) {
  return (
    <SurfaceCard as="section" variant="glass" className="p-6">
      <SectionHeading
        titleAs="h1"
        variant="technical"
        title="Payment Methods"
        description="Manage cards used for invoice settlement. Cards are stored securely by Stripe — we only hold the last 4 digits and expiry."
        actions={
          <Button type="button" onClick={onAddCard}>
            <Plus className="h-4 w-4" />
            Add New Card
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {isLoading ? (
          // Mirrors KpiCard's shell and its four rows (icon tile, label, value, hint) rather
          // than standing in as one flat block: the card border and the text baselines are
          // already in place when the numbers land, so nothing jumps.
          [0, 1, 2].map((i) => (
            <article key={i} className="rounded-xl border border-border-soft bg-surface p-4">
              <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-7 w-32" />
              <Skeleton className="mt-1 h-4 w-28" />
            </article>
          ))
        ) : (
          <>
            <KpiCard
              icon={<CreditCard className="h-5 w-5 text-brand" />}
              label="Saved Cards"
              value={String(methodCount)}
              hint="Ready for payments"
            />
            <KpiCard
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              label="Default Method"
              value={defaultMethod ? `${defaultMethod.brandLabel} •••• ${defaultMethod.last4}` : "N/A"}
              hint={defaultMethod?.nickname ?? "Not set"}
            />
            <KpiCard
              icon={<Repeat className="h-5 w-5 text-brand" />}
              label="Auto Order Card"
              value={autoOrderMethod ? `${autoOrderMethod.brandLabel} •••• ${autoOrderMethod.last4}` : "Not set"}
              hint={
                autoOrderMethod ? (
                  <Link
                    href="/buyer-dashboard/auto-orders"
                    className="font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
                  >
                    Manage auto orders
                  </Link>
                ) : (
                  "Pick a card to run auto orders"
                )
              }
            />
          </>
        )}
      </div>
    </SurfaceCard>
  )
}
