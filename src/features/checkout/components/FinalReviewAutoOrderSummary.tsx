"use client"

import { Repeat, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AutoOrderLine } from "@/features/checkout/hooks/useCheckoutAutoOrder"
import { AUTO_ORDER_PERIOD_LABELS, AUTO_ORDER_PERIODS, type AutoOrderPeriod } from "@/lib/constants/auto-order"

interface FinalReviewAutoOrderSummaryProps {
  autoOrderLines: AutoOrderLine[]
  pendingUserProductIds: Set<string>
  onPeriodChange: (userProductId: string, period: AutoOrderPeriod) => Promise<void>
  onCancelRecurrence: (userProductId: string) => Promise<void>
}

/** The line pending the buyer's cancel confirmation. One modal for the whole list, not one per row. */
interface PendingCancellation {
  userProductId: string
  productName: string
}

/** Hoisted to module scope — the options never change per row, so this stays a single reference. */
const PERIOD_OPTIONS = AUTO_ORDER_PERIODS.map((period) => (
  <SelectItem key={period} value={period}>
    {AUTO_ORDER_PERIOD_LABELS[period]}
  </SelectItem>
))

/** Defined at module scope (not inside the parent) so it isn't recreated on every render. */
function AutoOrderRow({
  line,
  isPending,
  onPeriodChange,
  onRequestCancel,
}: {
  line: AutoOrderLine
  isPending: boolean
  onPeriodChange: (userProductId: string, period: AutoOrderPeriod) => Promise<void>
  onRequestCancel: (line: AutoOrderLine) => void
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span className="min-w-0 flex-1 basis-full truncate text-sm text-text-primary sm:basis-0">
        {line.productName}
        <span className="text-text-muted"> × {line.quantity}</span>
      </span>

      <div className="flex items-center gap-2">
        <Select
          value={line.period}
          disabled={isPending}
          onValueChange={(next) => {
            void onPeriodChange(line.userProductId, next as AutoOrderPeriod)
          }}
        >
          <SelectTrigger size="sm" aria-label={`Change repeat schedule for ${line.productName}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{PERIOD_OPTIONS}</SelectContent>
        </Select>

        <button
          type="button"
          disabled={isPending}
          onClick={() => onRequestCancel(line)}
          aria-label={`Cancel repeat for ${line.productName}`}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

export default function FinalReviewAutoOrderSummary({
  autoOrderLines,
  pendingUserProductIds,
  onPeriodChange,
  onCancelRecurrence,
}: FinalReviewAutoOrderSummaryProps) {
  const [pendingCancellation, setPendingCancellation] = useState<PendingCancellation | null>(null)

  if (autoOrderLines.length === 0) return null

  const closeConfirm = () => setPendingCancellation(null)

  return (
    <div className="rounded-xl border border-brand/25 bg-brand/5 p-6">
      <div className="mb-3 flex items-center gap-2">
        <Repeat className="h-5 w-5 text-brand" />
        <h3 className="text-lg font-semibold text-text-primary">Auto orders</h3>
      </div>

      <ul className="space-y-3">
        {autoOrderLines.map((line) => (
          <AutoOrderRow
            key={line.userProductId}
            line={line}
            isPending={pendingUserProductIds.has(line.userProductId)}
            onPeriodChange={onPeriodChange}
            onRequestCancel={(requestedLine) =>
              setPendingCancellation({
                userProductId: requestedLine.userProductId,
                productName: requestedLine.productName,
              })
            }
          />
        ))}
      </ul>

      <p className="mt-3 text-xs text-text-secondary">
        The first delivery is this order. Auto orders start counting from the day this payment goes through, and you can
        change or cancel them anytime in{" "}
        <Link
          href="/buyer-dashboard/auto-orders"
          className="font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
        >
          Auto Orders
        </Link>
        .
      </p>

      <ConfirmationModal
        isOpen={pendingCancellation !== null}
        onClose={closeConfirm}
        onConfirm={() => {
          if (!pendingCancellation) return
          const { userProductId } = pendingCancellation
          closeConfirm()
          void onCancelRecurrence(userProductId)
        }}
        title="Cancel repeat?"
        description={
          pendingCancellation
            ? `"${pendingCancellation.productName}" stays in this order as a one-time purchase — only the recurring schedule is removed.`
            : ""
        }
        confirmText="Cancel repeat"
        cancelText="Keep repeat"
        isDanger
      />
    </div>
  )
}
