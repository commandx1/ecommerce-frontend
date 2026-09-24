import { Loader2, Send, X } from "lucide-react"

interface AnswerComposerProps {
  mode: "composing" | "editing"
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
}

const COPY = {
  composing: { heading: "Your answer", submitLabel: "Submit answer", savingLabel: "Saving…" },
  editing: { heading: "Edit answer", submitLabel: "Save changes", savingLabel: "Saving…" },
} as const

export default function AnswerComposer({
  mode,
  value,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: AnswerComposerProps) {
  const copy = COPY[mode]

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{copy.heading}</p>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full resize-none rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 rounded-xl border border-border-strong px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {isSubmitting ? copy.savingLabel : copy.submitLabel}
        </button>
      </div>
    </div>
  )
}
