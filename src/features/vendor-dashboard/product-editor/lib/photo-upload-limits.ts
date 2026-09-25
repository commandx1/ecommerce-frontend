import { formatMb } from "@/lib/helpers/format"

// Backend limits (ecommerce-api has NO multipart override, so Spring Boot 3.5.7 defaults apply):
//   spring.servlet.multipart.max-file-size    = 1MB  per file
//   spring.servlet.multipart.max-request-size = 10MB per request
// Enforcing them here turns an opaque backend 400 ("Maximum upload size exceeded") into a
// message that names the file and the limit. Raising the 1MB ceiling is a backend change -
// see BACKEND-HANDOFF.md §14; if it is raised, update these two constants to match.
export const MAX_PHOTO_BYTES = 1024 * 1024
export const MAX_REQUEST_BYTES = 10 * 1024 * 1024

export type PhotoCheck = { ok: true } | { ok: false; title: string; message: string }

const OK: PhotoCheck = { ok: true }

const isOversized = (file: File) => file.size > MAX_PHOTO_BYTES

const totalBytes = (files: Array<File | null>) =>
  files.filter((f): f is File => Boolean(f)).reduce((sum, f) => sum + f.size, 0)

const REQUEST_TOO_LARGE: PhotoCheck = {
  ok: false,
  title: "Photos are too large together",
  message: `The server accepts up to ${formatMb(MAX_REQUEST_BYTES)} per upload. Remove a photo and try again.`,
}

/**
 * A new cover photo, checked on its own and against the gallery already picked. The request
 * total is checked here too: a vendor who fills the gallery first and then swaps the cover via
 * "Change" never passes through the gallery check.
 */
export function checkCoverPhoto(file: File, galleryPhotos: readonly File[]): PhotoCheck {
  if (isOversized(file)) {
    return {
      ok: false,
      title: "Photo is too large",
      message: `${file.name} is ${formatMb(file.size)}. The largest photo the server accepts is ${formatMb(MAX_PHOTO_BYTES)}.`,
    }
  }
  return totalBytes([file, ...galleryPhotos]) > MAX_REQUEST_BYTES ? REQUEST_TOO_LARGE : OK
}

/** New gallery photos: every oversized file is named, then the whole request is checked. */
export function checkGalleryPhotos(
  files: readonly File[],
  current: { coverPhoto: File | null; photos: readonly File[] },
): PhotoCheck {
  const tooBig = files.filter(isOversized)
  if (tooBig.length > 0) {
    return {
      ok: false,
      title: tooBig.length === 1 ? "Photo is too large" : "Some photos are too large",
      message: `${tooBig.map((f) => f.name).join(", ")} — the largest photo the server accepts is ${formatMb(MAX_PHOTO_BYTES)}.`,
    }
  }
  return totalBytes([current.coverPhoto, ...current.photos, ...files]) > MAX_REQUEST_BYTES ? REQUEST_TOO_LARGE : OK
}
