"use client"

import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"

interface DeleteProductModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  productName: string
}

/** Visually distinct from the shared `ConfirmationModal`, so it stays its own component. */
export default function DeleteProductModal({ isOpen, onClose, onConfirm, productName }: DeleteProductModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      maxWidthClassName="max-w-md"
      overlayClassName="bg-brand-strong/40 backdrop-blur-[2px]"
      contentClassName="glass-panel p-0"
    >
      <div className="p-6">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Delete Product</h3>
        <p className="mb-6 text-text-secondary">
          Are you sure you want to delete "{productName}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-lg px-4">
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} className="rounded-lg px-4">
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
