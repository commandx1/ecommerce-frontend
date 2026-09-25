"use client"

import { Loader2 } from "lucide-react"
import Modal from "@/components/ui/Modal"

export interface PendingVendorReturnRejectAction {
  orderItemId: string
  productName: string
}

interface RejectReturnModalProps {
  id: string
  pendingRejectReturnAction: PendingVendorReturnRejectAction | null
  rejectReturnReason: string
  rejectReturnError: string | null
  isSubmitting: boolean
  onReasonChange: (reason: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function RejectReturnModal({
  id,
  pendingRejectReturnAction,
  rejectReturnReason,
  rejectReturnError,
  isSubmitting,
  onReasonChange,
  onClose,
  onSubmit,
}: RejectReturnModalProps) {
  return (
    <Modal
      isOpen={Boolean(pendingRejectReturnAction)}
      onClose={() => {
        if (isSubmitting) return
        onClose()
      }}
      title="Reject return request"
      maxWidthClassName="max-w-lg"
      closeOnEscape={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
    >
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Reject return for this item?</h3>
          {pendingRejectReturnAction ? (
            <p className="mt-1 text-sm text-text-secondary">{pendingRejectReturnAction.productName}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-return-reject-reason`} className="text-sm font-medium text-text-secondary">
            Rejection reason
          </label>
          <textarea
            id={`${id}-return-reject-reason`}
            rows={3}
            value={rejectReturnReason}
            onChange={(event) => onReasonChange(event.target.value)}
            disabled={isSubmitting}
            placeholder="Explain why the return is rejected"
            className="w-full rounded-lg border border-border-strong bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          {rejectReturnError ? <p className="text-xs font-medium text-danger">{rejectReturnError}</p> : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Confirm reject"
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
