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

  // Reset the selection only when the *content* of the image list actually changes, not merely
  // its reference. Callers (e.g. `ProductHero` -> `ProductHeroGallery`) often rebuild
  // `thumbnailImages` as a fresh array on every render, which recomputed `images` above and,
  // when this effect keyed on `[images]` directly, reverted a user's explicit thumbnail pick
  // back to the main image on the very next unrelated render (e.g. the magnifier's mousemove).
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
