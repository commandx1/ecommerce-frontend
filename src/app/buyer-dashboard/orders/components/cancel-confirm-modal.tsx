"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import { useBuyerOrdersCancelModalActions, useBuyerOrdersCancelModalState } from "../context/buyer-orders-context"

export default function CancelConfirmModal() {
  const { isConfirmingCancel, pendingCancelAction } = useBuyerOrdersCancelModalState()
  const { confirmPendingCancelAction, setPendingCancelAction } = useBuyerOrdersCancelModalActions()

  const handleClose = () => {
    setPendingCancelAction(null)
  }

  return (
    <Modal
      isOpen={Boolean(pendingCancelAction)}
      onClose={() => {
        if (isConfirmingCancel) return
        handleClose()
      }}
      title="Confirm cancellation"
      maxWidthClassName="max-w-lg"
      closeOnEscape={!isConfirmingCancel}
      closeOnOverlayClick={!isConfirmingCancel}
    >
      <div className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-text-primary">Cancel order item(s)?</h3>
        <p className="text-sm text-text-secondary">
          This will submit a cancellation request for the selected item(s). Do you want to continue?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isConfirmingCancel}>
            Keep order
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void confirmPendingCancelAction()}
            disabled={isConfirmingCancel}
          >
            {isConfirmingCancel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              "Confirm cancel"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
