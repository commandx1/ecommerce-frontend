import { CheckCircle } from "lucide-react"
import type { ExistingImages, LinkedImages, PhotoFiles } from "../../lib/product-media"

interface UploadSummaryProps {
  photoFiles: PhotoFiles
  existingImages: ExistingImages
  linkedImages: LinkedImages
}

/** One line per image source; a new cover file hides the existing/linked cover lines it replaces. */
export default function UploadSummary({ photoFiles, existingImages, linkedImages }: UploadSummaryProps) {
  const newCover = photoFiles.coverPhoto
  const hasAny =
    newCover ||
    photoFiles.photos.length > 0 ||
    existingImages.coverPhoto ||
    existingImages.photos.length > 0 ||
    linkedImages.coverPhoto ||
    linkedImages.photos.length > 0
  if (!hasAny) return null

  return (
    <div className="bg-surface-muted rounded-lg p-4">
      <h4 className="text-sm font-medium text-text-primary mb-2">Images Summary</h4>
      <ul className="text-sm text-text-secondary space-y-1">
        {existingImages.coverPhoto && !newCover && (
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 text-brand mr-2" />
            Cover photo: Existing image
          </li>
        )}
        {newCover && (
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 text-success mr-2" />
            Cover photo: {newCover.name} (new)
          </li>
        )}
        {linkedImages.coverPhoto && !newCover && (
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 text-brand mr-2" />
            Cover photo: link
          </li>
        )}
        {existingImages.photos.length > 0 && (
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 text-brand mr-2" />
            Existing photos: {existingImages.photos.length} image(s)
          </li>
        )}
        {photoFiles.photos.length > 0 && (
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 text-success mr-2" />
            New photos: {photoFiles.photos.length} file(s)
          </li>
        )}
        {linkedImages.photos.length > 0 && (
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 text-brand mr-2" />
            Linked photos: {linkedImages.photos.length} image(s)
          </li>
        )}
      </ul>
    </div>
  )
}
