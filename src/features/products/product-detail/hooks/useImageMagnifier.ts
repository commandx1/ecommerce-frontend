import { type MouseEvent, type RefObject, useCallback, useState } from "react"

export interface MagnifierPosition {
  screenX: number
  screenY: number
  naturalX: number
  naturalY: number
  naturalWidth: number
  naturalHeight: number
  isVisible: boolean
}

const initialPosition: MagnifierPosition = {
  screenX: 0,
  screenY: 0,
  naturalX: 0,
  naturalY: 0,
  naturalWidth: 0,
  naturalHeight: 0,
  isVisible: false,
}

export const useImageMagnifier = (imageRef: RefObject<HTMLImageElement>) => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [position, setPosition] = useState<MagnifierPosition>(initialPosition)

  const toggleMagnifier = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev
      if (!next) {
        setPosition(initialPosition)
      }
      return next
    })
  }, [])

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!isEnabled || !imageRef.current) return

      const image = imageRef.current
      const rect = image.getBoundingClientRect()

      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        setPosition((prev) => ({ ...prev, isVisible: false }))
        return
      }

      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const relativeX = mouseX / rect.width
      const relativeY = mouseY / rect.height

      const naturalX = relativeX * image.naturalWidth
      const naturalY = relativeY * image.naturalHeight

      setPosition({
        screenX: event.clientX,
        screenY: event.clientY,
        naturalX,
        naturalY,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        isVisible: true,
      })
    },
    [imageRef, isEnabled],
  )

  const handleMouseLeave = useCallback(() => {
    setPosition((prev) => ({ ...prev, isVisible: false }))
  }, [])

  return {
    isEnabled,
    position,
    toggleMagnifier,
    handleMouseMove,
    handleMouseLeave,
  }
}
