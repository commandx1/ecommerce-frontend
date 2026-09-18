"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

const PLACEHOLDER = "/dentypro-product-placeholder.png"

type ProductImageWithFallbackProps = Omit<ImageProps, "src"> & {
  src?: string | null
}

const ProductImageWithFallback = ({ src, alt, ...rest }: ProductImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const resolvedSrc = hasError || !src ? PLACEHOLDER : src

  return (
    <>
      {rest.fill && isLoading && <div className="absolute inset-0 animate-pulse bg-gray-200/70" />}
      <Image
        {...rest}
        src={resolvedSrc}
        alt={alt}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </>
  )
}

export default ProductImageWithFallback
