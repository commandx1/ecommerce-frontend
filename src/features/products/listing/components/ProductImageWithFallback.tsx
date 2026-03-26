"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

type ProductImageWithFallbackProps = Omit<ImageProps, "src"> & {
  src: string
}

const ProductImageWithFallback = ({ src, alt, ...rest }: ProductImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const resolvedSrc = hasError ? "/dentypro-product-placeholder.png" : src

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
