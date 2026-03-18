"use client"

interface ClearCartConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ClearCartConfirmModal({ open, onClose, onConfirm }: ClearCartConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-cart-title"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 id="clear-cart-title" className="text-lg font-bold text-gray-900 mb-2">
          Clear cart?
        </h3>
        <p className="text-sm text-gray-600 mb-6">All items will be removed from your cart. This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Clear cart
          </button>
        </div>
      </div>
    </div>
  )
}
