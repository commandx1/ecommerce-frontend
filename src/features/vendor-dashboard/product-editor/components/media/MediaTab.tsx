import type { ProductMedia } from "../../hooks/useProductMedia"
import CoverPhotoField from "./CoverPhotoField"
import GalleryField from "./GalleryField"
import UploadSummary from "./UploadSummary"

interface MediaTabProps {
  media: ProductMedia
  locked: boolean
  coverPhotoError?: string
}

/** Cover photo, gallery and the summary of every image that will be sent. */
export default function MediaTab({ media, locked, coverPhotoError }: MediaTabProps) {
  return (
    <div className="space-y-8">
      <CoverPhotoField
        filePreview={media.photoFiles.coverPhotoPreview}
        existingUrl={media.existingImages.coverPhoto}
        linkedUrl={media.linkedImages.coverPhoto}
        mode={media.coverPhotoMode}
        locked={locked}
        urlInput={media.coverPhotoUrlInput}
        urlError={media.coverPhotoUrlError}
        error={coverPhotoError}
        inputRef={media.coverPhotoInputRef}
        onModeChange={media.setCoverPhotoMode}
        onFileChange={media.handleCoverPhotoChange}
        onOpenPicker={media.openCoverPhotoPicker}
        onRemove={media.removeCoverPhoto}
        onUrlChange={media.changeCoverPhotoUrl}
        onAddLink={media.addCoverPhotoLink}
      />

      <GalleryField
        existingPhotos={media.existingImages.photos}
        filePreviews={media.photoFiles.photosPreviews}
        linkedPhotos={media.linkedImages.photos}
        mode={media.photosMode}
        locked={locked}
        urlInput={media.photoUrlInput}
        urlError={media.photoUrlError}
        inputRef={media.photosInputRef}
        onModeChange={media.setPhotosMode}
        onFilesChange={media.handlePhotosChange}
        onOpenPicker={media.openPhotosPicker}
        onUrlChange={media.changePhotoUrl}
        onAddLink={media.addPhotoLink}
        onRemoveExisting={media.removeExistingPhoto}
        onRemoveFile={media.removePhoto}
        onRemoveLinked={media.removeLinkedPhoto}
      />

      <UploadSummary
        photoFiles={media.photoFiles}
        existingImages={media.existingImages}
        linkedImages={media.linkedImages}
      />
    </div>
  )
}
