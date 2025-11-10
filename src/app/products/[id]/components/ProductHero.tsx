"use client"

import { Check, Heart, Search, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

interface ProductHeroProps {
  product: {
    title: string
    description: string
    category: string
    rating: number
    reviewCount: number
    sku: string
    features: string[]
    mainImage: string
    thumbnailImages: string[]
    badge?: string
  }
}

const ProductHero = ({ product }: ProductHeroProps) => {
  const productData = product
  const [selectedImage, setSelectedImage] = useState(productData.mainImage)
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [magnifierPosition, setMagnifierPosition] = useState({
    screenX: 0,
    screenY: 0,
    naturalX: 0,
    naturalY: 0,
    isVisible: false,
  })
  const imageRef = useRef<HTMLImageElement>(null)

  const toggleMagnifier = () => {
    setShowMagnifier((prev) => !prev)
    if (showMagnifier) {
      setMagnifierPosition({ screenX: 0, screenY: 0, naturalX: 0, naturalY: 0, isVisible: false })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showMagnifier || !imageRef.current) {
      return
    }

    const image = imageRef.current
    const rect = image.getBoundingClientRect()

    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const relativeX = mouseX / rect.width
      const relativeY = mouseY / rect.height

      const naturalX = relativeX * image.naturalWidth
      const naturalY = relativeY * image.naturalHeight

      setMagnifierPosition({
        screenX: e.clientX,
        screenY: e.clientY,
        naturalX,
        naturalY,
        isVisible: true,
      })
    } else {
      setMagnifierPosition((prev) => ({ ...prev, isVisible: false }))
    }
  }

  const handleMouseLeave = () => {
    setMagnifierPosition((prev) => ({ ...prev, isVisible: false }))
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `product-star-${i + 1}`
      return (
        <svg
          key={starId}
          className={`w-5 h-5 ${i < Math.floor(productData.rating) ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>{i < Math.floor(productData.rating) ? "Filled star" : "Empty star"}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )
    })
  }

  return (
    <section id="product-hero" className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div
              className="relative bg-gray-50 rounded-2xl overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              role="img"
              aria-label="Product image with magnifier"
            >
              <div className="aspect-square relative p-8">
                <Image
                  ref={imageRef}
                  className="w-full h-full object-contain"
                  src={selectedImage}
                  alt={productData.title}
                  width={600}
                  height={600}
                />
              </div>
              {productData.badge && (
                <div className="absolute top-4 left-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {productData.badge}
                  </span>
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
                    showMagnifier ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  aria-label="Toggle magnifier"
                  title="Toggle magnifier"
                  style={{ zIndex: 1000, position: "relative" }}
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Magnifier Glass */}
              {showMagnifier && magnifierPosition.isVisible && imageRef.current && (
                <div
                  className="fixed pointer-events-none border-2 border-gray-400 rounded-lg shadow-xl overflow-hidden bg-white"
                  style={{
                    width: "300px",
                    height: "200px",
                    left: `${magnifierPosition.screenX - 150}px`,
                    top: `${magnifierPosition.screenY - 100}px`,
                    backgroundImage: `url(${selectedImage})`,
                    backgroundPosition: `${-magnifierPosition.naturalX * 2.5 + 150}px ${-magnifierPosition.naturalY * 2.5 + 100}px`,
                    backgroundSize: `${imageRef.current.naturalWidth * 2.5}px ${imageRef.current.naturalHeight * 2.5}px`,
                    backgroundRepeat: "no-repeat",
                    zIndex: 100,
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {productData.thumbnailImages.map((image, index) => (
                <button
                  key={`${productData.sku}-thumbnail-${index}-${image}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`bg-gray-50 rounded-lg overflow-hidden aspect-square cursor-pointer border-2 transition-colors ${
                    selectedImage === image ? "border-steel-blue" : "border-transparent hover:border-steel-blue"
                  }`}
                >
                  <Image
                    className="w-full h-full object-contain p-2"
                    src={image}
                    alt={`${productData.title} thumbnail ${index + 1}`}
                    width={100}
                    height={100}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="bg-light-mint-gray text-steel-blue px-3 py-1 rounded-full text-sm font-medium">
                  {productData.category}
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Best Seller
                </span>
              </div>
              <h1 className="text-4xl font-bold text-steel-blue mb-4">{productData.title}</h1>
              <p className="text-xl text-gray-600 leading-relaxed">{productData.description}</p>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400">{renderStars()}</div>
                <span className="text-steel-blue font-semibold">{productData.rating}</span>
                <span className="text-gray-600">({productData.reviewCount} reviews)</span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-gray-600">SKU: {productData.sku}</span>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4">
              {productData.features.map((feature) => (
                <div key={feature} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* License Verification Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="text-yellow-600 text-lg mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">Professional Verification Required</h3>
                  <p className="text-yellow-700 text-sm">
                    This product requires verification of your dental license to view pricing and place orders.{" "}
                    <a href="/verification" className="underline font-medium">
                      Complete verification
                    </a>{" "}
                    to access exclusive professional pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductHero
