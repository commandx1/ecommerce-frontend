import { act, renderHook, waitFor } from "@testing-library/react"
import type { ChangeEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { setSearchParams } from "@/test/mocks/next-navigation"
import { createQueryWrapper } from "@/test/render"
import { INITIAL_VALUES } from "../lib/product-form"
import { INITIAL_EXISTING_IMAGES, INITIAL_LINKED_IMAGES, INITIAL_PHOTO_FILES } from "../lib/product-media"
import { useProductEditor } from "./useProductEditor"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const text = (name: string, value: string) =>
  ({ target: { name, value, type: "text", checked: false } }) as unknown as ChangeEvent<HTMLInputElement>

const files = (...names: string[]) =>
  ({
    target: { files: names.map((n) => new File(["x"], n, { type: "image/png" })), value: "" },
  }) as unknown as ChangeEvent<HTMLInputElement>

const renderEditor = () => {
  const { wrapper } = createQueryWrapper()
  return renderHook(() => useProductEditor(), { wrapper })
}

let previewCount = 0
beforeEach(() => {
  previewCount = 0
  URL.createObjectURL = vi.fn(() => `blob:preview-${++previewCount}`)
  URL.revokeObjectURL = vi.fn()
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("useProductEditor — mode and view", () => {
  it("starts a plain create on the search view", () => {
    const { result } = renderEditor()
    expect(result.current).toMatchObject({ mode: "create", view: "search", isSignedIn: true, isBusy: false })
  })

  it.each([
    ["edit=up-9", "edit"],
    ["reviewEditId=p-1&reviewUserProductId=up-9", "reviewEdit"],
  ])("opens %s straight on the form (%s)", (params, mode) => {
    setSearchParams(params)
    const { result } = renderEditor()
    expect(result.current).toMatchObject({ mode, view: "form" })
  })

  it("reports a signed-out vendor", () => {
    useAuthStore.getState().clearAuth()
    const { result } = renderEditor()
    expect(result.current.isSignedIn).toBe(false)
  })
})

describe("useProductEditor — clearAll", () => {
  it("returns the form, media and search hooks to their initial values", async () => {
    const { result } = renderEditor()

    act(() => result.current.startNewProduct())
    expect(result.current.view).toBe("form")

    // Form state: typed values, an attribute, errors, a non-first tab.
    act(() => {
      result.current.form.handleInputChange(text("price", "42"))
      result.current.form.addAttribute()
      result.current.form.toggleDentalLicense()
    })
    act(() => {
      result.current.form.validateAll(false)
    })
    act(() => {
      for (const [name, value] of Object.entries({
        name: "Kit",
        skuCode: "S",
        stock: "1",
        shipmentFee: "1",
        heavyShippingSurcharge: "1",
        fulfillmentPolicy: "Ships within 1 day",
      })) {
        result.current.form.handleInputChange(text(name, value))
      }
    })
    act(() => {
      result.current.form.validateAll(false)
    })
    expect(result.current.form.activeTab).toBe("details")

    // Media state: files, links, modes and a link error.
    act(() => result.current.media.handleCoverPhotoChange(files("cover.png")))
    act(() => result.current.media.handlePhotosChange(files("a.png", "b.png")))
    act(() => {
      result.current.media.setCoverPhotoMode("link")
      result.current.media.setPhotosMode("link")
      result.current.media.changePhotoUrl("https://cdn/g.png")
      result.current.media.changeCoverPhotoUrl("not a url")
    })
    act(() => {
      result.current.media.addPhotoLink()
      result.current.media.addCoverPhotoLink()
    })
    expect(result.current.media.linkedImages.photos).toEqual(["https://cdn/g.png"])
    expect(result.current.media.coverPhotoUrlError).not.toBe("")

    // Search state: a settled query with results, a brand filter, the dropdown open.
    act(() => {
      result.current.search.setSelectedBrand("MARK3")
      result.current.search.setSearchQuery("composite")
    })
    await waitFor(() => expect(result.current.search.results.length).toBeGreaterThan(0), { timeout: 3000 })
    expect(result.current.search.showDropdown).toBe(true)

    act(() => result.current.backToSearch())

    expect(result.current.view).toBe("search")
    expect(result.current.form).toMatchObject({
      values: INITIAL_VALUES,
      attributes: [],
      editDiscount: "",
      errors: {},
      activeTab: "basic",
      isProductSelected: false,
      selectedProduct: null,
    })
    expect(result.current.media).toMatchObject({
      photoFiles: INITIAL_PHOTO_FILES,
      existingImages: INITIAL_EXISTING_IMAGES,
      linkedImages: INITIAL_LINKED_IMAGES,
      coverPhotoMode: "upload",
      photosMode: "upload",
      coverPhotoUrlInput: "",
      photoUrlInput: "",
      coverPhotoUrlError: "",
      photoUrlError: "",
    })
    expect(result.current.search).toMatchObject({
      searchQuery: "",
      selectedBrand: null,
      results: [],
      hasMore: false,
      showDropdown: false,
    })
    for (const preview of ["blob:preview-1", "blob:preview-2", "blob:preview-3"]) {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(preview)
    }
    expect(result.current.tabErrorCounts).toEqual({ basic: 0, details: 0, media: 0 })
  })
})
