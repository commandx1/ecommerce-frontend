import { useEffect, useMemo, useState } from "react"

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

  useEffect(() => {
    setSelectedImage(images[0] || FALLBACK_IMAGE)
  }, [images])

  return {
    images,
    selectedImage,
    setSelectedImage,
    fallbackImage: FALLBACK_IMAGE,
  }
}
