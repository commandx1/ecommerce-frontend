/** Files picked in the Media tab, with the object URLs used for their previews. */
export interface PhotoFiles {
  coverPhoto: File | null
  coverPhotoPreview: string | null
  photos: File[]
  photosPreviews: string[]
}

/** Absolute URLs of the images a loaded (edit / review-edit) product already has. */
export interface ExistingImages {
  coverPhoto: string | null
  photos: string[]
}

/** Image URLs the vendor typed in "Add via Link" mode. */
export interface LinkedImages {
  coverPhoto: string | null
  photos: string[]
}

export type PhotoInputMode = "upload" | "link"

export const INITIAL_PHOTO_FILES: PhotoFiles = {
  coverPhoto: null,
  coverPhotoPreview: null,
  photos: [],
  photosPreviews: [],
}

export const INITIAL_EXISTING_IMAGES: ExistingImages = { coverPhoto: null, photos: [] }

export const INITIAL_LINKED_IMAGES: LinkedImages = { coverPhoto: null, photos: [] }

export const INVALID_IMAGE_URL_MESSAGE = "Please enter a valid image URL (starting with http:// or https://)"

export function hasCoverPhoto(files: PhotoFiles, existing: ExistingImages, linked: LinkedImages): boolean {
  return Boolean(files.coverPhoto || existing.coverPhoto || linked.coverPhoto)
}

/** Adding a URL that is already linked is a no-op (returns `linked` itself). */
export function addLinkedPhoto(linked: LinkedImages, url: string): LinkedImages {
  return linked.photos.includes(url) ? linked : { ...linked, photos: [...linked.photos, url] }
}

export function removeAt<T>(items: readonly T[], index: number): T[] {
  return items.filter((_, i) => i !== index)
}
