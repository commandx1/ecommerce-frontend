"use client"

import { Heart, Search } from "lucide-react"
import { useRef } from "react"
import { useImageMagnifier } from "../hooks/useImageMagnifier"
import { useProductImageGallery } from "../hooks/useProductImageGallery"
import ImageMagnifierOverlay from "./ImageMagnifierOverlay"
import LoadableImage from "./LoadableImage"

interface ProductHeroGalleryProps {
  title: string
  sku: string
  mainImage: string
  thumbnailImages: string[]
  badge?: string
}

const ProductHeroGallery = ({ title, sku, mainImage, thumbnailImages, badge }: ProductHeroGalleryProps) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const { images, selectedImage, setSelectedImage } = useProductImageGallery(mainImage, thumbnailImages)
  const { isEnabled, position, toggleMagnifier, handleMouseMove, handleMouseLeave } = useImageMagnifier(imageRef)

  return (
    <div className="space-y-4">
      <div
        className="relative bg-gray-50 rounded-2xl overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label="Product image with magnifier"
      >
        <div className="aspect-square relative p-8">
          <LoadableImage
            ref={imageRef}
            src={selectedImage}
            alt={title}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain"
          />
        </div>
        {badge && (
          <div className="absolute top-4 left-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">{badge}</span>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Add to favorites"
          >
            <Heart className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" />
          </button>
        </div>
        <div className="absolute bottom-4 right-4">
          <button
            type="button"
            onClick={toggleMagnifier}
            className={`w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-colors ${
              isEnabled ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"
            }`}
            aria-label="Toggle magnifier"
            title="Toggle magnifier"
            style={{ zIndex: 1000, position: "relative" }}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {isEnabled && <ImageMagnifierOverlay imageSrc={selectedImage} position={position} />}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <button
            key={`${sku}-thumbnail-${index}-${image}`}
            type="button"
            onClick={() => setSelectedImage(image)}
            className={`relative bg-gray-50 rounded-lg overflow-hidden aspect-square cursor-pointer border-2 transition-colors ${
              selectedImage === image ? "border-steel-blue" : "border-transparent hover:border-steel-blue"
            }`}
          >
            <LoadableImage
              src={image}
              alt={`${title} thumbnail ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 12vw, 25vw"
              className="object-contain p-2"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProductHeroGallery
