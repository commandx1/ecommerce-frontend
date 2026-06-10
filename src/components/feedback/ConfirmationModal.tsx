"use client"

import { AlertTriangle, X } from "lucide-react"
import Modal from "@/components/ui/Modal"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
  isLoading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-md" overlayClassName="bg-black/50">
      <div className="overflow-hidden rounded-2xl bg-surface-elevated">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className={`rounded-full p-2 ${isDanger ? "bg-danger/10" : "bg-brand/10"}`}>
              <AlertTriangle className={`h-6 w-6 ${isDanger ? "text-danger" : "text-brand"}`} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted transition-colors hover:text-text-secondary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <h3 className="mb-2 text-xl font-bold text-text-primary">{title}</h3>
          <p className="text-text-secondary">{description}</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-soft bg-surface-muted p-6 sm:flex-row-reverse">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2.5 font-semibold text-white transition-all disabled:opacity-50 ${
              isDanger ? "bg-danger hover:bg-danger/90" : "bg-brand hover:bg-brand/90"
            }`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 rounded-lg border border-border-strong bg-surface-elevated px-4 py-2.5 font-semibold text-text-secondary transition-all hover:bg-surface-muted disabled:opacity-50"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
