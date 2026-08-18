"use client"

import { Repeat } from "lucide-react"
import Link from "next/link"
import type { AutoOrderLine } from "@/features/checkout/hooks/useCheckoutAutoOrder"

interface FinalReviewAutoOrderSummaryProps {
  autoOrderLines: AutoOrderLine[]
}

export default function FinalReviewAutoOrderSummary({ autoOrderLines }: FinalReviewAutoOrderSummaryProps) {
  if (autoOrderLines.length === 0) return null

  return (
    <div className="rounded-xl border border-brand/25 bg-brand/5 p-6">
      <div className="mb-3 flex items-center gap-2">
        <Repeat className="h-5 w-5 text-brand" />
        <h3 className="text-lg font-semibold text-text-primary">Repeat orders</h3>
      </div>

      <ul className="space-y-2">
        {autoOrderLines.map((line) => (
          <li key={line.userProductId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
              {line.productName}
              <span className="text-text-muted"> × {line.quantity}</span>
            </span>
            <span className="text-sm font-medium text-brand">{line.periodLabel}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-text-secondary">
        The first delivery is this order. Repeats start counting from the day this payment goes through, and you can
        change or cancel them anytime in{" "}
        <Link
          href="/buyer-dashboard/auto-orders"
          className="font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
        >
          Auto Orders
        </Link>
        . To change a schedule now, go back to your cart.
      </p>
    </div>
  )
}
