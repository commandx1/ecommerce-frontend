import { Upload, X } from "lucide-react"
import Image from "next/image"
import type { ChangeEvent, RefObject } from "react"
import type { PhotoInputMode } from "../../lib/product-media"
import { ImageUrlInput, PhotoModeToggle, showImagePlaceholder } from "./media-controls"

interface CoverPhotoFieldProps {
  /** Preview sources in display priority: a new file wins over an existing image, which wins over a link. */
  filePreview: string | null
  existingUrl: string | null
  linkedUrl: string | null
  mode: PhotoInputMode
  locked: boolean
  urlInput: string
  urlError: string
  error?: string
  inputRef: RefObject<HTMLInputElement | null>
  onModeChange: (mode: PhotoInputMode) => void
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  onOpenPicker: () => void
  onRemove: () => void
  onUrlChange: (value: string) => void
  onAddLink: () => void
}

export default function CoverPhotoField(props: CoverPhotoFieldProps) {
  const { filePreview, existingUrl, linkedUrl, mode, locked } = props
  const previewSrc = filePreview || existingUrl || linkedUrl

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-text-primary mb-2">
        Cover Photo *<span className="text-text-muted font-normal ml-2">(Main product image)</span>
      </legend>
      <p className="text-text-muted text-sm mb-4">
        Upload a high-quality cover image for your product, or add it via a link. This will be the main image displayed.
      </p>

      <PhotoModeToggle mode={mode} locked={locked} onChange={props.onModeChange} />

      <input
        ref={props.inputRef}
        type="file"
        accept="image/*"
        onChange={props.onFileChange}
        disabled={locked}
        className="hidden"
        id="coverPhotoInput"
      />

      {previewSrc ? (
        <div className="relative inline-block">
          <div className="w-48 h-48 bg-surface rounded-lg overflow-hidden border-2 border-brand">
            <Image
              src={previewSrc}
              alt="Cover preview"
              className="w-full h-full object-cover"
              width={192}
              height={192}
              onError={showImagePlaceholder}
            />
          </div>
          <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-1 rounded">
            {filePreview ? "New Cover" : existingUrl ? "Existing" : "Link"}
          </span>
          <button
            type="button"
            onClick={props.onRemove}
            disabled={locked}
            className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-destructive"
          >
            <X className="w-4 h-4" />
          </button>
          {mode === "upload" && filePreview && (
            <button
              type="button"
              onClick={props.onOpenPicker}
              className="absolute bottom-2 right-2 px-3 py-1 bg-surface-elevated text-text-primary text-xs rounded shadow hover:bg-surface-muted transition-colors"
            >
              Change
            </button>
          )}
        </div>
      ) : mode === "upload" ? (
        <button
          type="button"
          onClick={props.onOpenPicker}
          disabled={locked}
          className="border-2 border-dashed border-border-soft rounded-lg p-8 text-center hover:border-brand hover:bg-surface-muted transition-colors cursor-pointer w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">Click to upload cover photo</p>
          <p className="text-text-muted text-sm mt-1">PNG, JPG, GIF — up to 1MB each, 10MB in total</p>
        </button>
      ) : (
        <ImageUrlInput
          value={props.urlInput}
          error={props.urlError}
          locked={locked}
          className="border-2 border-dashed border-border-soft rounded-lg p-6 w-full max-w-md"
          onChange={props.onUrlChange}
          onAdd={props.onAddLink}
        />
      )}
      {props.error && <p className="text-destructive text-sm mt-2">{props.error}</p>}
    </fieldset>
  )
}
