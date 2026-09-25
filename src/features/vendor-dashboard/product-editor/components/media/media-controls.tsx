import { Link2, Upload } from "lucide-react"
import type { SyntheticEvent } from "react"
import type { PhotoInputMode } from "../../lib/product-media"

const IMAGE_PLACEHOLDER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E"

/** `onError` for a preview <Image>: swaps a broken image for a generic picture icon. */
export const showImagePlaceholder = (e: SyntheticEvent<HTMLImageElement>) => {
  ;(e.target as HTMLImageElement).src = IMAGE_PLACEHOLDER_SRC
}

const MODE_BUTTONS = [
  { mode: "upload", label: "Upload", icon: Upload },
  { mode: "link", label: "Add via Link", icon: Link2 },
] as const

interface PhotoModeToggleProps {
  mode: PhotoInputMode
  locked: boolean
  onChange: (mode: PhotoInputMode) => void
}

export function PhotoModeToggle({ mode, locked, onChange }: PhotoModeToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {MODE_BUTTONS.map(({ mode: buttonMode, label, icon: Icon }) => (
        <button
          key={buttonMode}
          type="button"
          onClick={() => onChange(buttonMode)}
          disabled={locked}
          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === buttonMode ? "bg-brand text-white" : "bg-surface text-text-secondary hover:bg-surface-muted"
          }`}
        >
          <Icon className="w-4 h-4 mr-1.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

interface ImageUrlInputProps {
  value: string
  error: string
  locked: boolean
  className: string
  onChange: (value: string) => void
  onAdd: () => void
}

/** URL box of "Add via Link" mode; the error clears as soon as the URL is edited. */
export function ImageUrlInput({ value, error, locked, className, onChange, onAdd }: ImageUrlInputProps) {
  return (
    <div className={className}>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          placeholder="https://example.com/image.jpg"
          className="flex-1 px-3 py-2 border border-border-soft rounded-lg text-sm bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={locked}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  )
}
