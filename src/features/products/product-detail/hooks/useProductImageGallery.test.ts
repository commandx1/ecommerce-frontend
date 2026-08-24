import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useProductImageGallery } from "./useProductImageGallery"

const FALLBACK_IMAGE = "/dentypro-product-placeholder.png"

describe("useProductImageGallery", () => {
  it("merges the main image with thumbnails and selects the main image by default", () => {
    const { result } = renderHook(() => useProductImageGallery("main.jpg", ["thumb1.jpg", "thumb2.jpg"]))

    expect(result.current.images).toEqual(["main.jpg", "thumb1.jpg", "thumb2.jpg"])
    expect(result.current.selectedImage).toBe("main.jpg")
  })

  it("de-duplicates the main image when it also appears in the thumbnails", () => {
    const { result } = renderHook(() => useProductImageGallery("main.jpg", ["main.jpg", "thumb.jpg"]))

    expect(result.current.images).toEqual(["main.jpg", "thumb.jpg"])
  })

  it("filters out falsy thumbnail entries", () => {
    const { result } = renderHook(() => useProductImageGallery("main.jpg", ["", "thumb.jpg", "" as string]))

    expect(result.current.images).toEqual(["main.jpg", "thumb.jpg"])
  })

  it("falls back to the placeholder image when there are no images at all", () => {
    const { result } = renderHook(() => useProductImageGallery("", []))

    expect(result.current.images).toEqual([FALLBACK_IMAGE])
    expect(result.current.selectedImage).toBe(FALLBACK_IMAGE)
    expect(result.current.fallbackImage).toBe(FALLBACK_IMAGE)
  })

  it("supports a single image with no thumbnails", () => {
    const { result } = renderHook(() => useProductImageGallery("solo.jpg", []))

    expect(result.current.images).toEqual(["solo.jpg"])
    expect(result.current.selectedImage).toBe("solo.jpg")
  })

  it("setSelectedImage lets the caller pick any image from the gallery, including an arbitrary/invalid one, when thumbnailImages is a stable reference", () => {
    const thumbnails = ["thumb.jpg"]
    const { result } = renderHook(() => useProductImageGallery("main.jpg", thumbnails))

    act(() => {
      result.current.setSelectedImage("thumb.jpg")
    })
    expect(result.current.selectedImage).toBe("thumb.jpg")

    // The hook does not validate that the value belongs to `images` - it is a plain setter.
    act(() => {
      result.current.setSelectedImage("not-in-the-list.jpg")
    })
    expect(result.current.selectedImage).toBe("not-in-the-list.jpg")
  })

  // Y4 fix (previously a locked-in bug): the reset effect used to depend on `[images]`, and
  // `images` is a `useMemo` keyed on `[mainImage, thumbnailImages]`. If the caller passes a
  // `thumbnailImages` array that is NOT referentially stable across renders (e.g. built inline
  // from a view-model mapped fresh on every parent render - which is how
  // `ProductHero` -> `ProductHeroGallery` receives `product.thumbnailImages`, since nothing
  // memoizes that view model), `images` got a new identity every render, the reset effect fired
  // again, and the user's `setSelectedImage` pick was immediately reverted back to the main image
  // on the very next render - even one triggered by something unrelated (e.g. the magnifier's
  // mousemove state). The hook now keys the reset effect on the *content* of the image list
  // (`images.join("|")`) instead of its reference, so an unrelated rerender that rebuilds an
  // equivalent array no longer clobbers the user's selection.
  it("keeps a picked image selected across an unrelated rerender, even if thumbnailImages is a fresh array each time", () => {
    const { result, rerender } = renderHook(() => useProductImageGallery("main.jpg", ["thumb.jpg"]))

    act(() => {
      result.current.setSelectedImage("thumb.jpg")
    })
    // An unrelated rerender (here, an explicit one standing in for e.g. the magnifier's mousemove
    // state) recomputes `images` from a brand-new array literal with the same content - the
    // selection must survive it.
    rerender()
    expect(result.current.selectedImage).toBe("thumb.jpg")
  })

  it("resets the selected image to the new first image when the images prop changes", () => {
    const { result, rerender } = renderHook(
      ({ mainImage, thumbnails }: { mainImage: string; thumbnails: string[] }) =>
        useProductImageGallery(mainImage, thumbnails),
      { initialProps: { mainImage: "a.jpg", thumbnails: ["b.jpg"] } },
    )

    act(() => {
      result.current.setSelectedImage("b.jpg")
    })
    expect(result.current.selectedImage).toBe("b.jpg")

    rerender({ mainImage: "c.jpg", thumbnails: ["d.jpg"] })
    expect(result.current.selectedImage).toBe("c.jpg")
  })
})
