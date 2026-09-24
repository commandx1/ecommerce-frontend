import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from "lucide-react"
import type { ChangeEventHandler } from "react"
import { Textarea } from "@/components/ui/textarea"

interface TicketDescriptionFieldProps {
  textareaId: string
  value: string
  onChange: ChangeEventHandler<HTMLTextAreaElement>
}

const TicketDescriptionField = ({ textareaId, value, onChange }: TicketDescriptionFieldProps) => {
  return (
    <div>
      <label htmlFor={textareaId} className="mb-2 block text-sm font-semibold text-text-primary">
        Detailed Description *
      </label>
      <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
        {/* This formatting toolbar is decorative: none of these buttons has ever had an onClick,
            so the textarea below is a plain textarea. axe flagged them as `button-name` (critical)
            because they are icon-only with no accessible name - a screen reader announced five
            anonymous "button"s. Naming them alone would only make them accessibly misleading, so
            they are also disabled: nothing to press that does nothing. Either wire them to a real
            rich-text editor or drop the toolbar - see skeleton.md. */}
        <div className="flex items-center space-x-2 border-b border-border-soft bg-surface-muted/80 px-4 py-2">
          <button
            type="button"
            aria-label="Bold"
            disabled
            className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Italic"
            disabled
            className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Bulleted list"
            disabled
            className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Numbered list"
            disabled
            className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Insert link"
            disabled
            className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
        <Textarea
          id={textareaId}
          name="description"
          rows={6}
          value={value}
          onChange={onChange}
          className="w-full resize-none rounded-none border-0 px-4 py-3 shadow-none focus-visible:ring-0"
          placeholder={`Please provide detailed information about your issue, including:
• What you were trying to do
• What happened instead
• Any error messages you received
• Steps you've already tried
• When the issue first occurred`}
          required
        />
      </div>
    </div>
  )
}

export default TicketDescriptionField
