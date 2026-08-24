import { act, renderHook } from "@testing-library/react"
import type { MouseEvent, RefObject } from "react"
import { describe, expect, it } from "vitest"
import { useImageMagnifier } from "./useImageMagnifier"

const makeImageRef = (
  rect: Partial<DOMRect> = {},
  natural = { width: 800, height: 600 },
): RefObject<HTMLImageElement | null> => {
  const image = document.createElement("img")
  Object.defineProperty(image, "naturalWidth", { value: natural.width })
  Object.defineProperty(image, "naturalHeight", { value: natural.height })
  image.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    }) as DOMRect
  return { current: image }
}

const makeMouseEvent = (clientX: number, clientY: number) =>
  ({ clientX, clientY }) as unknown as MouseEvent<HTMLDivElement>

describe("useImageMagnifier", () => {
  it("starts disabled with the initial (invisible) position", () => {
    const ref = makeImageRef()
    const { result } = renderHook(() => useImageMagnifier(ref))

    expect(result.current.isEnabled).toBe(false)
    expect(result.current.position.isVisible).toBe(false)
  })

  it("toggleMagnifier enables and disables the magnifier", () => {
    const ref = makeImageRef()
    const { result } = renderHook(() => useImageMagnifier(ref))

    act(() => {
      result.current.toggleMagnifier()
    })
    expect(result.current.isEnabled).toBe(true)

    act(() => {
      result.current.toggleMagnifier()
    })
    expect(result.current.isEnabled).toBe(false)
  })

  it("resets the position to the initial (invisible) state when disabling", () => {
    const ref = makeImageRef()
    const { result } = renderHook(() => useImageMagnifier(ref))

    act(() => {
      result.current.toggleMagnifier()
    })
    act(() => {
      result.current.handleMouseMove(makeMouseEvent(100, 100))
    })
    expect(result.current.position.isVisible).toBe(true)

    act(() => {
      result.current.toggleMagnifier()
    })
    expect(result.current.position.isVisible).toBe(false)
    expect(result.current.position.naturalX).toBe(0)
    expect(result.current.position.naturalY).toBe(0)
  })

  it("does nothing on mouse move while disabled", () => {
    const ref = makeImageRef()
    const { result } = renderHook(() => useImageMagnifier(ref))

    act(() => {
      result.current.handleMouseMove(makeMouseEvent(100, 100))
    })
    expect(result.current.position.isVisible).toBe(false)
  })

  it("computes the natural-space position proportionally to the rendered rect once enabled", () => {
    const ref = makeImageRef(
      { left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200 },
      { width: 800, height: 600 },
    )
    const { result } = renderHook(() => useImageMagnifier(ref))

    act(() => {
      result.current.toggleMagnifier()
    })
    // Mouse at the center of a 200x200 rendered image mapped onto an 800x600 natural image.
    act(() => {
      result.current.handleMouseMove(makeMouseEvent(100, 100))
    })

    expect(result.current.position).toEqual({
      screenX: 100,
      screenY: 100,
      naturalX: 400,
      naturalY: 300,
      naturalWidth: 800,
      naturalHeight: 600,
      isVisible: true,
    })
  })

  it("hides the magnifier when the mouse moves outside the image bounds", () => {
    const ref = makeImageRef({ left: 50, top: 50, right: 150, bottom: 150, width: 100, height: 100 })
    const { result } = renderHook(() => useImageMagnifier(ref))

    act(() => {
      result.current.toggleMagnifier()
    })
    act(() => {
      result.current.handleMouseMove(makeMouseEvent(200, 200))
    })

    expect(result.current.position.isVisible).toBe(false)
  })

  it("handleMouseLeave hides the magnifier without touching the rest of the position", () => {
    const ref = makeImageRef()
    const { result } = renderHook(() => useImageMagnifier(ref))

    act(() => {
      result.current.toggleMagnifier()
    })
    act(() => {
      result.current.handleMouseMove(makeMouseEvent(100, 100))
    })
    act(() => {
      result.current.handleMouseLeave()
    })

    expect(result.current.position.isVisible).toBe(false)
    expect(result.current.position.naturalX).toBe(400)
  })

  it("does not crash when handleMouseMove is called while the ref is null", () => {
    const ref: RefObject<HTMLImageElement | null> = { current: null }
    const { result } = renderHook(() => useImageMagnifier(ref))

    act(() => {
      result.current.toggleMagnifier()
    })

    expect(() => {
      act(() => {
        result.current.handleMouseMove(makeMouseEvent(10, 10))
      })
    }).not.toThrow()
    expect(result.current.position.isVisible).toBe(false)
  })
})
