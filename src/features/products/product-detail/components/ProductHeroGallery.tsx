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
        className="relative overflow-hidden rounded-4xl border border-border-soft bg-surface-elevated shadow-panel"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label="Product image with magnifier"
      >
        <div className="aspect-square relative p-4 sm:p-6 md:p-8">
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
            <span className="rounded-full bg-success px-3 py-1 text-sm font-medium text-white">{badge}</span>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-surface shadow-soft transition-colors hover:text-danger"
            aria-label="Add to favorites"
          >
            <Heart className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" />
          </button>
        </div>
        <div className="absolute bottom-4 right-4 hidden lg:block">
          <button
            type="button"
            onClick={toggleMagnifier}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-surface shadow-soft transition-colors ${
              isEnabled ? "bg-accent text-brand" : "text-text-secondary hover:bg-surface-muted"
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

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {images.map((image, index) => (
          <button
            key={`${sku}-thumbnail-${index}-${image}`}
            type="button"
            onClick={() => setSelectedImage(image)}
            className={`relative aspect-square cursor-pointer overflow-hidden rounded-2xl border bg-surface-muted transition-colors ${
              selectedImage === image ? "border-brand" : "border-border-soft hover:border-brand/35"
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
