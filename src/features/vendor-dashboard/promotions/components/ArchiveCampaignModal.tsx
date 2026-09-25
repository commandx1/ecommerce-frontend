import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import type { PromotionCampaign } from "../lib/mock-data"

interface ArchiveCampaignModalProps {
  isOpen: boolean
  target: PromotionCampaign | null
  onClose: () => void
  onConfirm: () => void
}

export default function ArchiveCampaignModal({ isOpen, target, onClose, onConfirm }: ArchiveCampaignModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Archive Campaign"
      maxWidthClassName="max-w-md"
      contentClassName="glass-panel"
    >
      <div className="p-6">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Archive this campaign?</h3>
        <p className="mb-4 text-sm text-text-secondary">
          {target ? `“${target.name}” will be moved to archived campaigns.` : "This campaign will be archived."}
        </p>
        <p className="mb-6 text-xs text-text-muted">You can still view archived campaigns from the status filter.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-4">
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} className="rounded-xl px-4">
            Archive
          </Button>
        </div>
      </div>
    </Modal>
  )
}
