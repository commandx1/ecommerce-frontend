"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

type ProductImageWithFallbackProps = Omit<ImageProps, "src"> & {
  src: string
}

const ProductImageWithFallback = ({ src, alt, ...rest }: ProductImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false)
  const resolvedSrc = hasError ? "/dentypro-product-placeholder.png" : src

  return <Image {...rest} src={resolvedSrc} alt={alt} onError={() => setHasError(true)} />
}

export default ProductImageWithFallback
