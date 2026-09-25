import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CampaignChannel, PromotionCampaign } from "../lib/mock-data"
import { CHANNEL_OPTIONS } from "../lib/promotion-filters"
import type { CampaignFormState } from "../lib/promotion-form"

const OBJECTIVE_OPTIONS: PromotionCampaign["objective"][] = ["Revenue", "Retention", "Awareness", "Inventory Push"]

export type CampaignFormMode = "create" | "edit"

interface CampaignFormModalProps {
  isOpen: boolean
  mode: CampaignFormMode
  formState: CampaignFormState
  onFormStateChange: (updater: (prev: CampaignFormState) => CampaignFormState) => void
  onClose: () => void
  onSubmit: () => void
}

export default function CampaignFormModal({
  isOpen,
  mode,
  formState,
  onFormStateChange,
  onClose,
  onSubmit,
}: CampaignFormModalProps) {
  const title = mode === "create" ? "Create Campaign" : "Edit Campaign"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-2xl" contentClassName="glass-panel">
      <div className="p-6">
        <h2 className="mb-1 text-2xl font-semibold text-text-primary">{title}</h2>
        <p className="mb-5 text-sm text-text-secondary">Mock-only campaign form for dashboard workflow prototyping.</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
              Campaign Name
            </span>
            <input
              value={formState.name}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, name: event.target.value }))}
              className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
              placeholder="e.g. Summer Instruments Lift"
            />
          </label>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Objective</p>
            <Select
              value={formState.objective}
              onValueChange={(value) =>
                onFormStateChange((prev) => ({ ...prev, objective: value as PromotionCampaign["objective"] }))
              }
            >
              <SelectTrigger className="h-11 w-full rounded-xl border border-border-soft bg-surface shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVE_OPTIONS.map((objective) => (
                  <SelectItem key={objective} value={objective}>
                    {objective}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Channel</p>
            <Select
              value={formState.channel}
              onValueChange={(value) => onFormStateChange((prev) => ({ ...prev, channel: value as CampaignChannel }))}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border border-border-soft bg-surface shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.filter((channel) => channel !== "All").map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
              Budget (USD)
            </span>
            <input
              type="number"
              min={1}
              value={formState.budget}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, budget: event.target.value }))}
              className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
              Start Date
            </span>
            <input
              type="date"
              value={formState.startDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, startDate: event.target.value }))}
              className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
              End Date
            </span>
            <input
              type="date"
              value={formState.endDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, endDate: event.target.value }))}
              className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-4">
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} className="rounded-xl px-4">
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
