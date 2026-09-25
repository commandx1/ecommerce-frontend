"use client"

import { Loader2 } from "lucide-react"
import Modal from "@/components/ui/Modal"

export interface PendingVendorCancelAction {
  orderItemIds: string[]
  description: string
  options?: {
    cancelingItemId?: string
    cancelingOrderId?: string
  }
}

interface CancelConfirmModalProps {
  pendingCancelAction: PendingVendorCancelAction | null
  isConfirmingCancel: boolean
  onKeepOrder: () => void
  onConfirm: () => void
}

export default function CancelConfirmModal({
  pendingCancelAction,
  isConfirmingCancel,
  onKeepOrder,
  onConfirm,
}: CancelConfirmModalProps) {
  return (
    <Modal
      isOpen={Boolean(pendingCancelAction)}
      onClose={() => {
        if (isConfirmingCancel) return
        onKeepOrder()
      }}
      title="Confirm cancellation"
      maxWidthClassName="max-w-lg"
      closeOnEscape={!isConfirmingCancel}
      closeOnOverlayClick={!isConfirmingCancel}
    >
      <div className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-text-primary">
          {pendingCancelAction?.orderItemIds.length && pendingCancelAction.orderItemIds.length > 1
            ? "Cancel all selected order items?"
            : "Cancel this order item?"}
        </h3>
        <p className="text-sm text-text-secondary">
          This will submit a cancellation request for the selected item(s). Do you want to continue?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onKeepOrder}
            disabled={isConfirmingCancel}
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
          >
            Keep order
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmingCancel}
            className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isConfirmingCancel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              "Confirm cancel"
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
