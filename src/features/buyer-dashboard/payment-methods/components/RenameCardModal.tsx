import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import FormField from "./FormField"

export default function RenameCardModal({
  isOpen,
  newNickname,
  isSaving,
  onNicknameChange,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  newNickname: string
  isSaving: boolean
  onNicknameChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Card" maxWidthClassName="max-w-sm">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-text-primary">Rename card</h3>
        <p className="mt-1 text-sm text-text-secondary">Update the display name for this card.</p>

        <div className="mt-5">
          <FormField label="New nickname">
            <Input
              value={newNickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="e.g. Backup Card"
              disabled={isSaving}
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
