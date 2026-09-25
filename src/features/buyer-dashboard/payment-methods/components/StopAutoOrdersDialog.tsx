import ConfirmationModal from "@/components/feedback/ConfirmationModal"

export default function StopAutoOrdersDialog({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Stop using this card for auto orders?"
      description="All of your active auto orders will be paused until you pick another card. Your schedules are kept, so you can resume them later."
      confirmText="Stop auto orders"
      cancelText="Keep using it"
      isDanger
      isLoading={isLoading}
    />
  )
}
