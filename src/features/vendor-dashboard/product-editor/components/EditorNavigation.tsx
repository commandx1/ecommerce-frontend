import { Save } from "lucide-react"
import type { EditorMode, TabKey } from "../lib/product-form"

const SUBMIT_LABELS: Record<EditorMode, { idle: string; busy: string }> = {
  create: { idle: "Submit", busy: "Submitting..." },
  edit: { idle: "Update Product", busy: "Updating..." },
  reviewEdit: { idle: "Resubmit for Review", busy: "Resubmitting..." },
}

interface EditorNavigationProps {
  activeTab: TabKey
  mode: EditorMode
  isBusy: boolean
  /** Id of the <form> the submit button belongs to. */
  formId: string
  onPrevious: () => void
  onNext: () => void
}

/** Previous / Next, with Next replaced by the submit button on the last tab. */
export default function EditorNavigation({
  activeTab,
  mode,
  isBusy,
  formId,
  onPrevious,
  onNext,
}: EditorNavigationProps) {
  const labels = SUBMIT_LABELS[mode]

  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-border-soft">
      <button
        type="button"
        onClick={onPrevious}
        className={`px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium ${
          activeTab === "basic" ? "invisible" : ""
        }`}
      >
        Previous
      </button>
      {activeTab === "media" ? (
        <button
          type="submit"
          form={formId}
          disabled={isBusy}
          className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          {isBusy ? labels.busy : labels.idle}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 bg-accent-strong text-muted rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Next
        </button>
      )}
    </div>
  )
}
