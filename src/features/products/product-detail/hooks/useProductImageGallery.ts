import { useEffect, useMemo, useRef, useState } from "react"

const FALLBACK_IMAGE = "/dentypro-product-placeholder.png"

const uniqueImages = (images: string[]) => {
  const seen = new Set<string>()
  return images.filter((image) => {
    if (!image) return false
    if (seen.has(image)) return false
    seen.add(image)
    return true
  })
}

export const useProductImageGallery = (mainImage: string, thumbnailImages: string[]) => {
  const images = useMemo(() => {
    const merged = uniqueImages([mainImage, ...thumbnailImages])
    return merged.length > 0 ? merged : [FALLBACK_IMAGE]
  }, [mainImage, thumbnailImages])

  const [selectedImage, setSelectedImage] = useState(images[0] || FALLBACK_IMAGE)

  // Reset the selection only when the image list's *content* changes: callers rebuild the array on
  // every render, and keying on its reference reverted a thumbnail pick on the next mousemove.
  const imagesKey = images.join("|")
  const previousImagesKey = useRef(imagesKey)
  useEffect(() => {
    if (previousImagesKey.current === imagesKey) return
    previousImagesKey.current = imagesKey
    setSelectedImage(images[0] || FALLBACK_IMAGE)
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on the
    // stringified image list (imagesKey) rather than `images` itself, so a re-render that
    // rebuilds `images` with the same content does not re-trigger the reset.
  }, [imagesKey])

  return {
    images,
    selectedImage,
    setSelectedImage,
    fallbackImage: FALLBACK_IMAGE,
  }
}
