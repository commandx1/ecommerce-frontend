import { Image as ImageIcon, Plus, X } from "lucide-react"
import Image from "next/image"
import type { ChangeEvent, RefObject } from "react"
import type { PhotoInputMode } from "../../lib/product-media"
import { ImageUrlInput, PhotoModeToggle, showImagePlaceholder } from "./media-controls"

interface GalleryFieldProps {
  existingPhotos: string[]
  filePreviews: string[]
  linkedPhotos: string[]
  mode: PhotoInputMode
  locked: boolean
  urlInput: string
  urlError: string
  inputRef: RefObject<HTMLInputElement | null>
  onModeChange: (mode: PhotoInputMode) => void
  onFilesChange: (e: ChangeEvent<HTMLInputElement>) => void
  onOpenPicker: () => void
  onUrlChange: (value: string) => void
  onAddLink: () => void
  onRemoveExisting: (index: number) => void
  onRemoveFile: (index: number) => void
  onRemoveLinked: (index: number) => void
}

export default function GalleryField(props: GalleryFieldProps) {
  const { existingPhotos, filePreviews, linkedPhotos, mode, locked } = props
  const hasPhotos = filePreviews.length > 0 || existingPhotos.length > 0 || linkedPhotos.length > 0

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-text-primary mb-2">
        Additional Photos
        <span className="text-text-muted font-normal ml-2">(Optional)</span>
      </legend>
      <p className="text-text-muted text-sm mb-4">
        Upload additional product images to show different angles or details, or add them via a link.
      </p>

      <PhotoModeToggle mode={mode} locked={locked} onChange={props.onModeChange} />

      <input
        ref={props.inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={props.onFilesChange}
        disabled={locked}
        className="hidden"
        id="photosInput"
      />

      <div className="space-y-4">
        {mode === "upload" ? (
          <button
            type="button"
            onClick={props.onOpenPicker}
            disabled={locked}
            className="inline-flex items-center px-4 py-2 bg-surface text-text-primary rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Photos
          </button>
        ) : (
          <ImageUrlInput
            value={props.urlInput}
            error={props.urlError}
            locked={locked}
            className="border-2 border-dashed border-border-soft rounded-lg p-4 max-w-md"
            onChange={props.onUrlChange}
            onAdd={props.onAddLink}
          />
        )}

        {hasPhotos ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {existingPhotos.map((photo, index) => (
              <GalleryThumb
                key={`existing-${photo}`}
                src={photo}
                alt={`Existing ${index + 1}`}
                badge="Existing"
                frameClass="border border-border-soft"
                badgeClass="bg-brand/80"
                locked={locked}
                onRemove={() => props.onRemoveExisting(index)}
              />
            ))}
            {filePreviews.map((preview, index) => (
              <GalleryThumb
                key={preview}
                src={preview}
                alt={`New ${index + 1}`}
                badge="New"
                frameClass="border-2 border-success/60"
                badgeClass="bg-success/80"
                locked={locked}
                onRemove={() => props.onRemoveFile(index)}
              />
            ))}
            {linkedPhotos.map((photo, index) => (
              <GalleryThumb
                key={`link-${photo}`}
                src={photo}
                alt={`Linked ${index + 1}`}
                badge="Link"
                frameClass="border-2 border-brand/60"
                badgeClass="bg-brand/80"
                locked={locked}
                onRemove={() => props.onRemoveLinked(index)}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border-soft rounded-lg p-8 text-center">
            <ImageIcon className="w-10 h-10 text-text-muted/70 mx-auto mb-3" />
            <p className="text-text-muted">No additional photos added</p>
            <p className="text-text-muted/70 text-sm mt-1">
              Click "Add Photos" or add an image link to add more images
            </p>
          </div>
        )}
      </div>
    </fieldset>
  )
}

interface GalleryThumbProps {
  src: string
  alt: string
  badge: string
  frameClass: string
  badgeClass: string
  locked: boolean
  onRemove: () => void
}

function GalleryThumb({ src, alt, badge, frameClass, badgeClass, locked, onRemove }: GalleryThumbProps) {
  return (
    <div className="relative group">
      <div className={`aspect-square bg-surface rounded-lg overflow-hidden ${frameClass}`}>
        <Image
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          width={192}
          height={192}
          onError={showImagePlaceholder}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={locked}
        className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <X className="w-4 h-4" />
      </button>
      <span className={`absolute bottom-2 left-2 ${badgeClass} text-white text-xs px-2 py-0.5 rounded`}>{badge}</span>
    </div>
  )
}
