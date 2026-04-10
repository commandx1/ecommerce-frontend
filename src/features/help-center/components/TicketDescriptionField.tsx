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
        <div className="flex items-center space-x-2 border-b border-border-soft bg-surface-muted/80 px-4 py-2">
          <button type="button" className="rounded p-1 text-text-muted hover:text-text-primary">
            <Bold className="w-4 h-4" />
          </button>
          <button type="button" className="rounded p-1 text-text-muted hover:text-text-primary">
            <Italic className="w-4 h-4" />
          </button>
          <button type="button" className="rounded p-1 text-text-muted hover:text-text-primary">
            <List className="w-4 h-4" />
          </button>
          <button type="button" className="rounded p-1 text-text-muted hover:text-text-primary">
            <ListOrdered className="w-4 h-4" />
          </button>
          <button type="button" className="rounded p-1 text-text-muted hover:text-text-primary">
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
