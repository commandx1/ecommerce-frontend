import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { INITIAL_EXISTING_IMAGES, INITIAL_LINKED_IMAGES, INITIAL_PHOTO_FILES } from "../lib/product-media"
import { useProductMedia } from "./useProductMedia"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const MB = 1024 * 1024

const file = (name: string, bytes = 10) => {
  const f = new File(["x"], name, { type: "image/png" })
  Object.defineProperty(f, "size", { value: bytes })
  return f
}

/** A change event whose target records the value reset the handlers perform. */
const changeEvent = (files: File[]) => {
  const target = { files, value: "C:\\fakepath\\picked.png" }
  return { event: { target } as unknown as ChangeEvent<HTMLInputElement>, target }
}

const setup = () => {
  const onCoverPhotoAdded = vi.fn()
  const hook = renderHook(() => useProductMedia({ onCoverPhotoAdded }))
  return { ...hook, onCoverPhotoAdded }
}

let previewCount = 0
beforeEach(() => {
  previewCount = 0
  URL.createObjectURL = vi.fn(() => `blob:preview-${++previewCount}`)
  URL.revokeObjectURL = vi.fn()
  for (const spy of Object.values(toastSpies)) spy.mockClear()
})

describe("useProductMedia — cover photo file", () => {
  it("previews a picked file, reports it and resets the input so the same file can be re-picked", () => {
    const { result, onCoverPhotoAdded } = setup()
    const { event, target } = changeEvent([file("cover.png")])

    act(() => result.current.handleCoverPhotoChange(event))

    expect(result.current.photoFiles.coverPhoto?.name).toBe("cover.png")
    expect(result.current.photoFiles.coverPhotoPreview).toBe("blob:preview-1")
    expect(result.current.hasCoverPhoto).toBe(true)
    expect(onCoverPhotoAdded).toHaveBeenCalledTimes(1)
    expect(target.value).toBe("")
  })

  it("revokes the previous preview when a second file replaces the first", () => {
    const { result } = setup()
    act(() => result.current.handleCoverPhotoChange(changeEvent([file("first.png")]).event))
    act(() => result.current.handleCoverPhotoChange(changeEvent([file("second.png")]).event))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1")
    expect(result.current.photoFiles.coverPhotoPreview).toBe("blob:preview-2")
  })

  it("rejects an oversized file with a toast and keeps the previous state", () => {
    const { result, onCoverPhotoAdded } = setup()
    const { event, target } = changeEvent([file("huge.png", 3 * MB)])

    act(() => result.current.handleCoverPhotoChange(event))

    expect(toastSpies.error).toHaveBeenCalledWith(
      "Photo is too large",
      "huge.png is 3MB. The largest photo the server accepts is 1MB.",
    )
    expect(result.current.photoFiles).toEqual(INITIAL_PHOTO_FILES)
    expect(onCoverPhotoAdded).not.toHaveBeenCalled()
    expect(target.value).toBe("")
  })

  it("rejects a cover that would push the already-picked gallery over the request total", () => {
    const { result } = setup()
    act(() =>
      result.current.handlePhotosChange(
        changeEvent(Array.from({ length: 10 }, (_, i) => file(`g${i}.png`, MB - 1))).event,
      ),
    )
    act(() => result.current.handleCoverPhotoChange(changeEvent([file("cover.png", MB)]).event))

    expect(toastSpies.error).toHaveBeenCalledWith("Photos are too large together", expect.stringContaining("10MB"))
    expect(result.current.photoFiles.coverPhoto).toBeNull()
  })
})

describe("useProductMedia — removing the cover", () => {
  it("removes sources in preview order: new file, then existing image, then link", () => {
    const { result } = setup()
    act(() => {
      result.current.seedExistingImages({ coverPhoto: "https://img/existing.png", photos: [] })
      result.current.changeCoverPhotoUrl("https://cdn/linked.png")
    })
    act(() => result.current.addCoverPhotoLink())
    act(() => result.current.handleCoverPhotoChange(changeEvent([file("cover.png")]).event))

    act(() => result.current.removeCoverPhoto())
    expect(result.current.photoFiles.coverPhoto).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1")
    expect(result.current.existingImages.coverPhoto).toBe("https://img/existing.png")

    act(() => result.current.removeCoverPhoto())
    expect(result.current.existingImages.coverPhoto).toBeNull()
    expect(result.current.linkedImages.coverPhoto).toBe("https://cdn/linked.png")

    act(() => result.current.removeCoverPhoto())
    expect(result.current.linkedImages.coverPhoto).toBeNull()
    expect(result.current.hasCoverPhoto).toBe(false)
  })
})

describe("useProductMedia — gallery", () => {
  it("appends picked files and removes one by index, revoking only its preview", () => {
    const { result } = setup()
    act(() => result.current.handlePhotosChange(changeEvent([file("a.png"), file("b.png"), file("c.png")]).event))

    act(() => result.current.removePhoto(1))

    expect(result.current.photoFiles.photos.map((f) => f.name)).toEqual(["a.png", "c.png"])
    expect(result.current.photoFiles.photosPreviews).toEqual(["blob:preview-1", "blob:preview-3"])
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-2")
  })

  it("names every oversized gallery file and adds none of them", () => {
    const { result } = setup()
    const { event, target } = changeEvent([file("big-a.png", 2 * MB), file("big-b.png", 2 * MB)])

    act(() => result.current.handlePhotosChange(event))

    expect(toastSpies.error).toHaveBeenCalledWith(
      "Some photos are too large",
      "big-a.png, big-b.png — the largest photo the server accepts is 1MB.",
    )
    expect(result.current.photoFiles.photos).toEqual([])
    expect(target.value).toBe("")
  })

  it("removes existing and linked photos by index", () => {
    const { result } = setup()
    act(() => result.current.seedExistingImages({ coverPhoto: null, photos: ["e1", "e2"] }))
    act(() => result.current.changePhotoUrl("https://cdn/l1.png"))
    act(() => result.current.addPhotoLink())
    act(() => result.current.changePhotoUrl("https://cdn/l2.png"))
    act(() => result.current.addPhotoLink())

    act(() => {
      result.current.removeExistingPhoto(0)
      result.current.removeLinkedPhoto(1)
    })

    expect(result.current.existingImages.photos).toEqual(["e2"])
    expect(result.current.linkedImages.photos).toEqual(["https://cdn/l1.png"])
  })
})

describe("useProductMedia — links", () => {
  it("adds a trimmed cover link, clears the input and reports it", () => {
    const { result, onCoverPhotoAdded } = setup()
    act(() => result.current.changeCoverPhotoUrl("  https://cdn/cover.png  "))
    act(() => result.current.addCoverPhotoLink())

    expect(result.current.linkedImages.coverPhoto).toBe("https://cdn/cover.png")
    expect(result.current.coverPhotoUrlInput).toBe("")
    expect(onCoverPhotoAdded).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["cover", "changeCoverPhotoUrl", "addCoverPhotoLink", "coverPhotoUrlError"],
    ["gallery", "changePhotoUrl", "addPhotoLink", "photoUrlError"],
  ] as const)(
    "%s: rejects a non-http(s) URL, then clears the error once the URL is edited",
    (_l, change, add, error) => {
      const { result } = setup()
      act(() => result.current[change]("ftp://example.com/a.png"))
      act(() => result.current[add]())
      expect(result.current[error]).toBe("Please enter a valid image URL (starting with http:// or https://)")

      act(() => result.current[change]("ftp://example.com/a.pngx"))
      expect(result.current[error]).toBe("")
    },
  )

  it("does not add the same gallery link twice", () => {
    const { result } = setup()
    for (let i = 0; i < 2; i++) {
      act(() => result.current.changePhotoUrl("https://cdn/g.png"))
      act(() => result.current.addPhotoLink())
    }
    expect(result.current.linkedImages.photos).toEqual(["https://cdn/g.png"])
  })
})

describe("useProductMedia — reset", () => {
  it("revokes every preview and returns every piece of media state to its initial value", () => {
    const { result } = setup()
    const cover = document.createElement("input")
    const gallery = document.createElement("input")
    cover.type = "text"
    gallery.type = "text"
    cover.value = "stale"
    gallery.value = "stale"
    result.current.coverPhotoInputRef.current = cover
    result.current.photosInputRef.current = gallery

    act(() => {
      result.current.handleCoverPhotoChange(changeEvent([file("cover.png")]).event)
      result.current.seedExistingImages({ coverPhoto: "https://img/e.png", photos: ["e1"] })
      result.current.setCoverPhotoMode("link")
      result.current.setPhotosMode("link")
      result.current.changeCoverPhotoUrl("bad")
      result.current.changePhotoUrl("bad")
    })
    act(() => result.current.handlePhotosChange(changeEvent([file("a.png"), file("b.png")]).event))
    act(() => {
      result.current.addCoverPhotoLink()
      result.current.addPhotoLink()
    })

    act(() => result.current.reset())

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1")
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-2")
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-3")
    expect(result.current).toMatchObject({
      photoFiles: INITIAL_PHOTO_FILES,
      existingImages: INITIAL_EXISTING_IMAGES,
      linkedImages: INITIAL_LINKED_IMAGES,
      hasCoverPhoto: false,
      coverPhotoMode: "upload",
      photosMode: "upload",
      coverPhotoUrlInput: "",
      photoUrlInput: "",
      coverPhotoUrlError: "",
      photoUrlError: "",
    })
    expect(cover.value).toBe("")
    expect(gallery.value).toBe("")
  })
})
