"use client"

import { Loader2, Percent } from "lucide-react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"

interface BulkDiscountModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  value: string
  onValueChange: (value: string) => void
  isApplying: boolean
  onApply: () => void
}

export default function BulkDiscountModal({
  isOpen,
  onClose,
  selectedCount,
  value,
  onValueChange,
  isApplying,
  onApply,
}: BulkDiscountModalProps) {
  const id = useId()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Discount"
      maxWidthClassName="max-w-md"
      overlayClassName="bg-brand-strong/40 backdrop-blur-[2px]"
      contentClassName="glass-panel p-0"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
            <Percent className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Bulk Discount</h3>
            <p className="text-sm text-text-secondary">
              Applies to {selectedCount} selected product{selectedCount > 1 ? "s" : ""}.
            </p>
          </div>
        </div>

        <label htmlFor={`${id}-bulk-discount-input`} className="mb-1.5 block text-sm font-medium text-text-primary">
          Discount (%)
        </label>
        <div className="relative">
          <input
            id={`${id}-bulk-discount-input`}
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="decimal"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="e.g. 12"
            className="w-full rounded-lg border border-border-strong py-2 pl-4 pr-10 text-text-primary placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <Percent className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-text-muted" />
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Enter a value between 0 and 100. Use 0 to remove the existing discount.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isApplying} className="rounded-lg px-4">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onApply}
            disabled={isApplying || value.trim() === ""}
            className="rounded-lg px-4"
          >
            {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply Discount
          </Button>
        </div>
      </div>
    </Modal>
  )
}
