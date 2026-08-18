"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import QuantityStepper from "@/components/ui/QuantityStepper"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AutoOrder } from "@/lib/api/auto-orders"
import {
  AUTO_ORDER_PERIOD_DAYS,
  AUTO_ORDER_PERIOD_LABELS,
  AUTO_ORDER_PERIODS,
  type AutoOrderPeriod,
} from "@/lib/constants/auto-order"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface AutoOrderEditModalProps {
  autoOrder: AutoOrder | null
  isSaving: boolean
  onClose: () => void
  onSave: (autoOrderId: string, quantity: number, period: AutoOrderPeriod) => void
}

export default function AutoOrderEditModal({ autoOrder, isSaving, onClose, onSave }: AutoOrderEditModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [period, setPeriod] = useState<AutoOrderPeriod>("ONE_MONTH")

  useEffect(() => {
    if (!autoOrder) return
    setQuantity(autoOrder.quantity)
    setPeriod(autoOrder.period)
  }, [autoOrder])

  const periodChanged = Boolean(autoOrder) && period !== autoOrder?.period

  return (
    <Modal isOpen={Boolean(autoOrder)} onClose={onClose} title="Edit auto order" maxWidthClassName="max-w-md">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-text-primary">Edit auto order</h3>
        <p className="mt-1 truncate text-sm text-text-secondary">{autoOrder?.productName}</p>

        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Quantity</p>
            <div className="flex items-center gap-4">
              <QuantityStepper
                value={quantity}
                disabled={isSaving}
                onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
                onIncrease={() => setQuantity((current) => current + 1)}
              />
              {autoOrder ? (
                <span className="text-sm text-text-secondary">
                  {formatCurrency(autoOrder.price * quantity)} per delivery
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Frequency</p>
            <Select value={period} disabled={isSaving} onValueChange={(next) => setPeriod(next as AutoOrderPeriod)}>
              <SelectTrigger className="w-full" aria-label="Auto order frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTO_ORDER_PERIODS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {AUTO_ORDER_PERIOD_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {periodChanged ? (
              <p className="mt-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                Changing the frequency restarts the countdown — the next order will be placed{" "}
                {AUTO_ORDER_PERIOD_DAYS[period]} days from today.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving || !autoOrder}
            onClick={() => {
              if (autoOrder) onSave(autoOrder.id, quantity, period)
            }}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
