import type { MagnifierPosition } from "../hooks/useImageMagnifier"

interface ImageMagnifierOverlayProps {
  imageSrc: string
  position: MagnifierPosition
  zoom?: number
}

const ImageMagnifierOverlay = ({ imageSrc, position, zoom = 2.5 }: ImageMagnifierOverlayProps) => {
  if (!position.isVisible || position.naturalWidth === 0 || position.naturalHeight === 0) {
    return null
  }

  const width = 300
  const height = 200

  return (
    <div
      className="fixed pointer-events-none border-2 border-gray-400 rounded-lg shadow-xl overflow-hidden bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${position.screenX - width / 2}px`,
        top: `${position.screenY - height / 2}px`,
        backgroundImage: `url(${imageSrc})`,
        backgroundPosition: `${-position.naturalX * zoom + width / 2}px ${-position.naturalY * zoom + height / 2}px`,
        backgroundSize: `${position.naturalWidth * zoom}px ${position.naturalHeight * zoom}px`,
        backgroundRepeat: "no-repeat",
        zIndex: 100,
      }}
    />
  )
}

export default ImageMagnifierOverlay
