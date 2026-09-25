import { describe, expect, it } from "vitest"
import { checkCoverPhoto, checkGalleryPhotos, MAX_PHOTO_BYTES, MAX_REQUEST_BYTES } from "./photo-upload-limits"

const MB = 1024 * 1024

const sized = (name: string, bytes: number) => {
  const file = new File(["x"], name, { type: "image/png" })
  Object.defineProperty(file, "size", { value: bytes })
  return file
}

const TOO_LARGE_TOGETHER = {
  ok: false,
  title: "Photos are too large together",
  message: "The server accepts up to 10MB per upload. Remove a photo and try again.",
}

describe("limits", () => {
  it("mirror Spring Boot's multipart defaults", () => {
    expect(MAX_PHOTO_BYTES).toBe(MB)
    expect(MAX_REQUEST_BYTES).toBe(10 * MB)
  })
})

describe("checkCoverPhoto", () => {
  it("accepts a file at exactly the per-file limit", () => {
    expect(checkCoverPhoto(sized("exact.png", MB), [])).toEqual({ ok: true })
  })

  it("names the file, its size and the limit when it is too big", () => {
    expect(checkCoverPhoto(sized("huge-cover.png", 3 * MB), [])).toEqual({
      ok: false,
      title: "Photo is too large",
      message: "huge-cover.png is 3MB. The largest photo the server accepts is 1MB.",
    })
  })

  it("rejects a cover that pushes the gallery over the request total", () => {
    const gallery = Array.from({ length: 9 }, (_, i) => sized(`g${i}.png`, MB))
    expect(checkCoverPhoto(sized("cover.png", MB), [...gallery, sized("g9.png", 2)])).toEqual(TOO_LARGE_TOGETHER)
  })

  it("accepts a cover that keeps the request at the total limit", () => {
    const gallery = Array.from({ length: 9 }, (_, i) => sized(`g${i}.png`, MB))
    expect(checkCoverPhoto(sized("cover.png", MB), gallery)).toEqual({ ok: true })
  })
})

describe("checkGalleryPhotos", () => {
  const none = { coverPhoto: null, photos: [] }

  it("uses the singular title for one oversized file", () => {
    expect(checkGalleryPhotos([sized("big.png", 2 * MB), sized("ok.png", 10)], none)).toEqual({
      ok: false,
      title: "Photo is too large",
      message: "big.png — the largest photo the server accepts is 1MB.",
    })
  })

  it("names every oversized file", () => {
    expect(checkGalleryPhotos([sized("big-a.png", 2 * MB), sized("big-b.png", 1.5 * MB)], none)).toEqual({
      ok: false,
      title: "Some photos are too large",
      message: "big-a.png, big-b.png — the largest photo the server accepts is 1MB.",
    })
  })

  it("counts the cover and the photos already picked toward the request total", () => {
    const current = { coverPhoto: sized("cover.png", MB), photos: Array.from({ length: 8 }, () => sized("p.png", MB)) }
    expect(checkGalleryPhotos([sized("new.png", MB)], current)).toEqual({ ok: true })
    expect(checkGalleryPhotos([sized("new.png", MB), sized("one-more.png", 1)], current)).toEqual(TOO_LARGE_TOGETHER)
  })
})
