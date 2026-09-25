import { describe, expect, it } from "vitest"
import {
  addLinkedPhoto,
  hasCoverPhoto,
  INITIAL_EXISTING_IMAGES,
  INITIAL_LINKED_IMAGES,
  INITIAL_PHOTO_FILES,
  removeAt,
} from "./product-media"

describe("hasCoverPhoto", () => {
  const file = new File(["c"], "cover.png")
  const withFile = { ...INITIAL_PHOTO_FILES, coverPhoto: file }
  const galleryOnly = { ...INITIAL_PHOTO_FILES, photos: [file] }

  it("is false with nothing picked", () => {
    expect(hasCoverPhoto(INITIAL_PHOTO_FILES, INITIAL_EXISTING_IMAGES, INITIAL_LINKED_IMAGES)).toBe(false)
  })

  it("accepts an uploaded file, an existing image or a linked URL", () => {
    expect(hasCoverPhoto(withFile, INITIAL_EXISTING_IMAGES, INITIAL_LINKED_IMAGES)).toBe(true)
    expect(
      hasCoverPhoto(INITIAL_PHOTO_FILES, { coverPhoto: "https://img/e.png", photos: [] }, INITIAL_LINKED_IMAGES),
    ).toBe(true)
    expect(
      hasCoverPhoto(INITIAL_PHOTO_FILES, INITIAL_EXISTING_IMAGES, { coverPhoto: "https://cdn/l.png", photos: [] }),
    ).toBe(true)
  })

  it("never lets gallery photos stand in for the cover", () => {
    expect(hasCoverPhoto(galleryOnly, { coverPhoto: null, photos: ["x"] }, { coverPhoto: null, photos: ["y"] })).toBe(
      false,
    )
  })
})

describe("addLinkedPhoto", () => {
  it("appends a new URL", () => {
    expect(addLinkedPhoto({ coverPhoto: null, photos: ["a"] }, "b")).toEqual({ coverPhoto: null, photos: ["a", "b"] })
  })

  it("returns the same object for a URL that is already linked", () => {
    const linked = { coverPhoto: null, photos: ["a"] }
    expect(addLinkedPhoto(linked, "a")).toBe(linked)
  })
})

describe("removeAt", () => {
  it.each([
    [0, ["b", "c"]],
    [1, ["a", "c"]],
    [2, ["a", "b"]],
    [5, ["a", "b", "c"]],
  ])("index %i -> %j", (index, expected) => {
    expect(removeAt(["a", "b", "c"], index)).toEqual(expected)
  })
})
