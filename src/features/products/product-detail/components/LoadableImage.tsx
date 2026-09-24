"use client"

import Image, { type ImageProps } from "next/image"
import { forwardRef, useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadableImageProps extends Omit<ImageProps, "src"> {
  src: string
  fallbackSrc?: string
  showSkeleton?: boolean
  skeletonClassName?: string
}

const LoadableImage = forwardRef<HTMLImageElement, LoadableImageProps>(
  (
    {
      src,
      fallbackSrc = "/dentypro-product-placeholder.png",
      showSkeleton = true,
      skeletonClassName,
      className,
      onError,
      onLoadingComplete,
      ...props
    },
    ref,
  ) => {
    const [resolvedSrc, setResolvedSrc] = useState(src)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      setResolvedSrc(src)
      setIsLoading(true)
    }, [src])

    return (
      <>
        {showSkeleton && isLoading && (
          <Skeleton aria-hidden="true" className={cn("absolute inset-0", skeletonClassName)} />
        )}
        <Image
          ref={ref}
          {...props}
          src={resolvedSrc}
          className={cn(isLoading ? "opacity-0" : "opacity-100 transition-opacity", className)}
          onError={(event) => {
            setResolvedSrc(fallbackSrc)
            setIsLoading(false)
            onError?.(event)
          }}
          onLoadingComplete={(image) => {
            setIsLoading(false)
            onLoadingComplete?.(image)
          }}
        />
      </>
    )
  },
)

LoadableImage.displayName = "LoadableImage"

export default LoadableImage
