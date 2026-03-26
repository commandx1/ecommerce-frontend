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
      <div className="overflow-hidden rounded-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-full ${isDanger ? "bg-red-50" : "bg-blue-50"}`}>
              <AlertTriangle className={`w-6 h-6 ${isDanger ? "text-red-600" : "text-blue-600"}`} />
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="bg-gray-50 p-6 flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition-all ${
              isDanger ? "bg-red-600 hover:bg-red-700" : "bg-steel-blue hover:bg-opacity-90"
            } disabled:opacity-50`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
