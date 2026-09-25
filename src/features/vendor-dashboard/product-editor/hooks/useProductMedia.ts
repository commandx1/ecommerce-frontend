"use client"

import { type ChangeEvent, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { isValidImageUrl } from "../lib/image-url"
import { checkCoverPhoto, checkGalleryPhotos } from "../lib/photo-upload-limits"
import {
  addLinkedPhoto,
  type ExistingImages,
  hasCoverPhoto,
  INITIAL_EXISTING_IMAGES,
  INITIAL_LINKED_IMAGES,
  INITIAL_PHOTO_FILES,
  INVALID_IMAGE_URL_MESSAGE,
  type LinkedImages,
  type PhotoFiles,
  type PhotoInputMode,
  removeAt,
} from "../lib/product-media"

/**
 * The Media tab's three image sources (picked files, a loaded product's existing images, typed
 * links), the upload/link toggles and their URL inputs. Owns the preview object URLs: every one
 * it creates is revoked when its file is replaced, removed or cleared.
 */
export function useProductMedia({ onCoverPhotoAdded }: { onCoverPhotoAdded: () => void }) {
  const [photoFiles, setPhotoFiles] = useState<PhotoFiles>(INITIAL_PHOTO_FILES)
  const [existingImages, setExistingImages] = useState<ExistingImages>(INITIAL_EXISTING_IMAGES)
  const [linkedImages, setLinkedImages] = useState<LinkedImages>(INITIAL_LINKED_IMAGES)
  const [coverPhotoMode, setCoverPhotoMode] = useState<PhotoInputMode>("upload")
  const [photosMode, setPhotosMode] = useState<PhotoInputMode>("upload")
  const [coverPhotoUrlInput, setCoverPhotoUrlInput] = useState("")
  const [photoUrlInput, setPhotoUrlInput] = useState("")
  const [coverPhotoUrlError, setCoverPhotoUrlError] = useState("")
  const [photoUrlError, setPhotoUrlError] = useState("")
  const coverPhotoInputRef = useRef<HTMLInputElement>(null)
  const photosInputRef = useRef<HTMLInputElement>(null)

  const removeCoverPhotoFile = () => {
    if (photoFiles.coverPhotoPreview) URL.revokeObjectURL(photoFiles.coverPhotoPreview)
    setPhotoFiles((prev) => ({ ...prev, coverPhoto: null, coverPhotoPreview: null }))
    if (coverPhotoInputRef.current) coverPhotoInputRef.current.value = ""
  }

  return {
    photoFiles,
    existingImages,
    linkedImages,
    hasCoverPhoto: hasCoverPhoto(photoFiles, existingImages, linkedImages),
    coverPhotoMode,
    photosMode,
    coverPhotoUrlInput,
    photoUrlInput,
    coverPhotoUrlError,
    photoUrlError,
    coverPhotoInputRef,
    photosInputRef,
    setCoverPhotoMode,
    setPhotosMode,
    openCoverPhotoPicker: () => coverPhotoInputRef.current?.click(),
    openPhotosPicker: () => photosInputRef.current?.click(),

    handleCoverPhotoChange: (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const check = checkCoverPhoto(file, photoFiles.photos)
        if (!check.ok) {
          showToast.error(check.title, check.message)
          e.target.value = ""
          return
        }
        if (photoFiles.coverPhotoPreview) URL.revokeObjectURL(photoFiles.coverPhotoPreview)
        setPhotoFiles((prev) => ({ ...prev, coverPhoto: file, coverPhotoPreview: URL.createObjectURL(file) }))
        onCoverPhotoAdded()
      }
      // Reset the input value so choosing the exact same file again (e.g. after picking the wrong
      // one first) still fires a change event - browsers don't fire one when the value is unchanged.
      e.target.value = ""
    },

    /** The preview's X: removes whichever source is shown (new file, then existing, then link). */
    removeCoverPhoto: () => {
      if (photoFiles.coverPhotoPreview) removeCoverPhotoFile()
      else if (existingImages.coverPhoto) setExistingImages((prev) => ({ ...prev, coverPhoto: null }))
      else setLinkedImages((prev) => ({ ...prev, coverPhoto: null }))
    },

    handlePhotosChange: (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const check = checkGalleryPhotos(files, photoFiles)
      if (!check.ok) {
        showToast.error(check.title, check.message)
        e.target.value = ""
        return
      }
      if (files.length > 0) {
        const newPreviews = files.map((file) => URL.createObjectURL(file))
        setPhotoFiles((prev) => ({
          ...prev,
          photos: [...prev.photos, ...files],
          photosPreviews: [...prev.photosPreviews, ...newPreviews],
        }))
      }
      // Same reason as the cover input: re-selecting a removed file must fire `change` again.
      e.target.value = ""
    },

    removePhoto: (index: number) => {
      URL.revokeObjectURL(photoFiles.photosPreviews[index])
      setPhotoFiles((prev) => ({
        ...prev,
        photos: removeAt(prev.photos, index),
        photosPreviews: removeAt(prev.photosPreviews, index),
      }))
    },
    removeExistingPhoto: (index: number) =>
      setExistingImages((prev) => ({ ...prev, photos: removeAt(prev.photos, index) })),
    removeLinkedPhoto: (index: number) =>
      setLinkedImages((prev) => ({ ...prev, photos: removeAt(prev.photos, index) })),

    changeCoverPhotoUrl: (value: string) => {
      setCoverPhotoUrlInput(value)
      if (coverPhotoUrlError) setCoverPhotoUrlError("")
    },
    addCoverPhotoLink: () => {
      if (!isValidImageUrl(coverPhotoUrlInput)) {
        setCoverPhotoUrlError(INVALID_IMAGE_URL_MESSAGE)
        return
      }
      setLinkedImages((prev) => ({ ...prev, coverPhoto: coverPhotoUrlInput.trim() }))
      setCoverPhotoUrlInput("")
      setCoverPhotoUrlError("")
      onCoverPhotoAdded()
    },
    changePhotoUrl: (value: string) => {
      setPhotoUrlInput(value)
      if (photoUrlError) setPhotoUrlError("")
    },
    addPhotoLink: () => {
      if (!isValidImageUrl(photoUrlInput)) {
        setPhotoUrlError(INVALID_IMAGE_URL_MESSAGE)
        return
      }
      const url = photoUrlInput.trim()
      setLinkedImages((prev) => addLinkedPhoto(prev, url))
      setPhotoUrlInput("")
      setPhotoUrlError("")
    },

    seedExistingImages: setExistingImages,

    /** Revokes every preview URL, empties all three sources and both file inputs. */
    reset: () => {
      if (photoFiles.coverPhotoPreview) URL.revokeObjectURL(photoFiles.coverPhotoPreview)
      for (const preview of photoFiles.photosPreviews) URL.revokeObjectURL(preview)
      setPhotoFiles(INITIAL_PHOTO_FILES)
      setExistingImages(INITIAL_EXISTING_IMAGES)
      setLinkedImages(INITIAL_LINKED_IMAGES)
      setCoverPhotoMode("upload")
      setPhotosMode("upload")
      setCoverPhotoUrlInput("")
      setPhotoUrlInput("")
      setCoverPhotoUrlError("")
      setPhotoUrlError("")
      if (coverPhotoInputRef.current) coverPhotoInputRef.current.value = ""
      if (photosInputRef.current) photosInputRef.current.value = ""
    },
  }
}

export type ProductMedia = ReturnType<typeof useProductMedia>
