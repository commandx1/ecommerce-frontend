"use client"

import { Loader2, Repeat } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AUTO_ORDER_PERIOD_DAYS,
  AUTO_ORDER_PERIOD_LABELS,
  AUTO_ORDER_PERIODS,
  type AutoOrderPeriod,
  DEFAULT_AUTO_ORDER_PERIOD,
} from "@/lib/constants/auto-order"

interface CartItemAutoOrderProps {
  userProductId: string
  value: AutoOrderPeriod | null
  /** Rejects when the schedule could not be saved, so the control can roll back. */
  onChange: (userProductId: string, period: AutoOrderPeriod | null) => Promise<void>
  disabled?: boolean
}

export default function CartItemAutoOrder({ userProductId, value, onChange, disabled }: CartItemAutoOrderProps) {
  const checkboxId = `${useId()}-auto-order`
  const [draft, setDraft] = useState<AutoOrderPeriod | null>(value)
  const [isSaving, setIsSaving] = useState(false)

  // Keep in sync when the cart is refetched (or another control changes the item)
  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = async (nextPeriod: AutoOrderPeriod | null) => {
    const previous = draft
    setDraft(nextPeriod)
    setIsSaving(true)
    try {
      await onChange(userProductId, nextPeriod)
    } catch {
      setDraft(previous)
    } finally {
      setIsSaving(false)
    }
  }

  const isEnabled = draft !== null
  const isBusy = isSaving || Boolean(disabled)

  return (
    <div className="mt-3 rounded-xl border border-border-soft bg-surface-elevated px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
          <Checkbox
            id={checkboxId}
            checked={isEnabled}
            disabled={isBusy}
            onChange={(event) => {
              void commit(event.target.checked ? (value ?? DEFAULT_AUTO_ORDER_PERIOD) : null)
            }}
          />
          <Repeat className={`h-4 w-4 ${isEnabled ? "text-brand" : "text-text-muted"}`} />
          <span className="font-medium">Auto-reorder this item</span>
        </label>

        {isEnabled ? (
          <Select
            value={draft ?? undefined}
            disabled={isBusy}
            onValueChange={(next) => {
              void commit(next as AutoOrderPeriod)
            }}
          >
            <SelectTrigger size="sm" aria-label="Auto-reorder frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTO_ORDER_PERIODS.map((period) => (
                <SelectItem key={period} value={period}>
                  {AUTO_ORDER_PERIOD_LABELS[period]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {isSaving ? <Loader2 className="h-4 w-4 animate-spin text-text-muted" /> : null}
      </div>

      <p className="mt-1.5 text-xs text-text-muted">
        {isEnabled && draft
          ? `We'll place this order again every ${AUTO_ORDER_PERIOD_DAYS[draft]} days, starting from the day this order is paid. Manage or cancel it anytime from Auto Orders.`
          : "Save time on supplies you use regularly — we'll reorder them for you on a schedule."}
      </p>
    </div>
  )
}
