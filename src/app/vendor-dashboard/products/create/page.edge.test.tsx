import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/lib/api/request"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct, makeUserProductDetailResponse, makeVendorUserProduct } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import CreateProductPage from "./page"

installRadixPointerPolyfills()

// Same rationale as page.validation.test.tsx / page.submit.test.tsx: this file drives the full
// multi-tab form through userEvent, which is legitimately slow under parallel worker load.
vi.setConfig({ testTimeout: 20_000 })

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

const brandFilterCalls = vi.hoisted(() => [] as Array<{ id?: string; hideAllOption?: boolean }>)

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("./components/BrandFilterDropdown", () => ({
  default: ({
    id,
    value,
    onChange,
    disabled,
    hideAllOption,
  }: {
    id?: string
    value: string | null
    onChange: (v: string | null) => void
    disabled?: boolean
    hideAllOption?: boolean
  }) => {
    brandFilterCalls.push({ id, hideAllOption })
    return id ? (
      <input
        id={id}
        aria-label="Brand"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
      />
    ) : null
  },
}))

const searchPage = (items: Array<{ id: string; name: string }>, opts: { last?: boolean; number?: number } = {}) => ({
  content: items.map((item) => ({ id: item.id, name: item.name, brand: "MARK3", coverPhotoPath: null })),
  totalElements: items.length,
  totalPages: 2,
  number: opts.number ?? 0,
  size: 10,
  numberOfElements: items.length,
  first: (opts.number ?? 0) === 0,
  last: opts.last ?? true,
  empty: items.length === 0,
})

const tabButton = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}`) })
const nextButton = () => screen.getByRole("button", { name: "Next" })

const openBlankForm = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<CreateProductPage />)
  await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
  await user.click(
    await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
  )
}

const fillBasicTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
  await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
  await user.type(screen.getByLabelText("Price *"), "42")
  await user.type(screen.getByLabelText("Stock *"), "7")
  await user.type(screen.getByLabelText("Shipment Fee *"), "5")
  await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
  await user.selectOptions(screen.getByRole("combobox", { name: "Fulfillment Policy *" }), "Ships within 2 days")
}

const selectCategory = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("combobox", { name: "Category 2" }))
  await user.click(await screen.findByRole("option", { name: "Endodontic products" }))
  await user.click(screen.getByRole("combobox", { name: "Category 3" }))
  await user.click(await screen.findByRole("option", { name: "Hand files-reamers-hedstroms" }))
  await user.click(screen.getByRole("combobox", { name: "Category 4" }))
  await user.click(await screen.findByRole("option", { name: "K-Files" }))
}

const fillDetailsTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Detailed Description *"), "A great dental product")
  await user.type(screen.getByLabelText("Manufacturer Code *"), "MNF-1")
  await user.type(screen.getByLabelText("Manufacturer *"), "MARK3")
  await user.type(screen.getByLabelText("Brand"), "Acme Dental")
  await selectCategory(user)
  await user.type(screen.getByLabelText("Manufacturer Site Product Page *"), "https://example.com/products/item")
  await user.type(screen.getByLabelText("Weight *"), "1.5")
}

/** Fills Basic + Details (both required for the Media tab to be reachable) and jumps to Media. */
const reachMediaTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await fillBasicTab(user)
  await user.click(tabButton("Product Details"))
  await fillDetailsTab(user)
  await user.click(tabButton("Media"))
}

const attachCoverPhotoFile = async (
  user: ReturnType<typeof userEvent.setup>,
  name = "cover.png",
  content = "cover-bytes",
) => {
  const file = new File([content], name, { type: "image/png" })
  const fileInput = document.querySelector("#coverPhotoInput") as HTMLInputElement
  await user.upload(fileInput, file)
  return fileInput
}

// A File whose reported size we control: jsdom derives `size` from the blob parts, so building a
// real >1MB buffer would make these tests needlessly slow.
const sizedFile = (name: string, bytes: number) => {
  const file = new File(["x"], name, { type: "image/png" })
  Object.defineProperty(file, "size", { value: bytes })
  return file
}

beforeEach(() => {
  vi.restoreAllMocks()
  URL.createObjectURL = vi.fn(() => "blob:preview")
  URL.revokeObjectURL = vi.fn()
  brandFilterCalls.length = 0
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("CreateProductPage — cover photo edge cases", () => {
  it("shows a preview and the new-cover badge after uploading a file", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await attachCoverPhotoFile(user)

    expect(screen.getByText("New Cover")).toBeInTheDocument()
  })

  it("clears the file input value after a selection, so picking the same file again still registers", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const fileInput = await attachCoverPhotoFile(user)

    // Browsers only fire `change` again for an unchanged input value when it has been reset;
    // this is what lets a vendor pick the exact same file a second time (e.g. after removing it).
    expect(fileInput.value).toBe("")
  })

  it("lets the vendor remove an uploaded cover photo and re-add a link instead", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)
    await attachCoverPhotoFile(user)

    await user.click(screen.getByRole("button", { name: "" })) // the X remove button (icon-only)

    expect(screen.queryByText("New Cover")).not.toBeInTheDocument()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview")
  })

  it("prefers the newly uploaded file over an existing link for the preview badge", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "https://cdn.example/a.png")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(screen.getByText("Link")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: /Upload/ })[0] as HTMLElement)
    await attachCoverPhotoFile(user)

    expect(screen.getByText("New Cover")).toBeInTheDocument()
    expect(screen.queryByText("Link")).not.toBeInTheDocument()
  })

  it("rejects a javascript: URL for the cover photo link", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "javascript:alert(1)")
    await user.click(screen.getByRole("button", { name: "Add" }))

    expect(
      await screen.findByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).toBeInTheDocument()
  })

  it("rejects a malformed cover photo URL", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "not a url at all")
    await user.click(screen.getByRole("button", { name: "Add" }))

    expect(
      await screen.findByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).toBeInTheDocument()
  })

  it("stores a file with a unicode, space-containing name", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await attachCoverPhotoFile(user, "kapak fotoğrafı ürün 01.png")

    expect(screen.getByText(/kapak fotoğrafı ürün 01\.png \(new\)/)).toBeInTheDocument()
  })
})

describe("CreateProductPage — additional photos edge cases", () => {
  const addGalleryPhotos = async (user: ReturnType<typeof userEvent.setup>, files: File[]) => {
    const input = document.querySelector("#photosInput") as HTMLInputElement
    await user.upload(input, files)
    return input
  }

  it("clears the multi-file input value after a selection", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const input = await addGalleryPhotos(user, [new File(["a"], "a.png", { type: "image/png" })])

    expect(input.value).toBe("")
  })

  it("adds several gallery photos and removes the middle one without shifting the wrong image", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await addGalleryPhotos(user, [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
      new File(["c"], "c.png", { type: "image/png" }),
    ])

    expect(screen.getByText("New photos: 3 file(s)")).toBeInTheDocument()
    const newImages = screen.getAllByAltText(/^New \d/)
    expect(newImages).toHaveLength(3)

    // Remove the middle photo (index 1, "New 2")
    const middleImage = screen.getByAltText("New 2")
    const removeButton = middleImage.closest(".group")?.querySelector("button") as HTMLElement
    await user.click(removeButton)

    expect(screen.getByText("New photos: 2 file(s)")).toBeInTheDocument()
    // The remaining two are re-labeled "New 1" / "New 2"; both original first/third files survive.
    expect(screen.getAllByAltText(/^New \d/)).toHaveLength(2)
  })

  it("adds a linked photo and prevents adding the exact same URL twice", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const linkButtons = screen.getAllByRole("button", { name: /Add via Link/ })
    await user.click(linkButtons[1] as HTMLElement)

    const urlInput = screen.getByPlaceholderText("https://example.com/image.jpg")
    await user.type(urlInput, "https://cdn.example/gallery.png")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(screen.getByText("Linked photos: 1 image(s)")).toBeInTheDocument()

    await user.type(urlInput, "https://cdn.example/gallery.png")
    await user.click(screen.getByRole("button", { name: "Add" }))

    expect(screen.getByText("Linked photos: 1 image(s)")).toBeInTheDocument()
  })

  it("removes a linked photo by index", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const linkButtons = screen.getAllByRole("button", { name: /Add via Link/ })
    await user.click(linkButtons[1] as HTMLElement)
    const urlInput = screen.getByPlaceholderText("https://example.com/image.jpg")
    await user.type(urlInput, "https://cdn.example/gallery.png")
    await user.click(screen.getByRole("button", { name: "Add" }))

    const linkedImage = screen.getByAltText("Linked 1")
    const removeButton = linkedImage.closest(".group")?.querySelector("button") as HTMLElement
    await user.click(removeButton)

    expect(screen.queryByText(/Linked photos:/)).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — clearing the form", () => {
  it("clears photos, links, and search state when starting over from the form", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)
    await attachCoverPhotoFile(user)

    await user.click(screen.getByRole("button", { name: /Back to Search/ }))

    expect(screen.getByRole("heading", { name: "Search Product" })).toBeInTheDocument()

    // Going back into a blank form shows none of the previous data.
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await user.click(
      await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
    )
    expect(screen.getByLabelText(/Product Name/)).toHaveValue("")
    await user.click(tabButton("Media"))
    expect(screen.queryByText("New Cover")).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — tab gates", () => {
  it("validates every skipped tab when jumping directly from Basic to Media", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)

    // Jump straight to Media without visiting Details - Details' required fields must still be
    // enforced, otherwise a vendor could submit with blank manufacturer/description/etc.
    await user.click(tabButton("Media"))

    // Blocked: the form is still on Basic (or wherever it lands), not Media.
    expect(screen.queryByText("Additional Photos")).not.toBeInTheDocument()
    expect(await screen.findByTitle(/errors/)).toBeInTheDocument()
  })

  it("lets the vendor reach Media once every skipped tab is actually valid", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))
    await fillDetailsTab(user)
    await user.click(tabButton("Basic Information"))

    // Jump forward again, this time both Basic and Details are valid.
    await user.click(tabButton("Media"))

    expect(screen.getByText("Additional Photos")).toBeInTheDocument()
  })
})

describe("CreateProductPage — numeric boundaries", () => {
  it("rejects a fractional stock value (backend stock is an integer)", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
    await user.type(screen.getByLabelText("Price *"), "42")
    await user.type(screen.getByLabelText("Stock *"), "7.5")
    await user.type(screen.getByLabelText("Shipment Fee *"), "5")
    await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
    await user.selectOptions(screen.getByRole("combobox", { name: "Fulfillment Policy *" }), "Ships within 2 days")
    await user.click(nextButton())

    expect(await screen.findByText("Stock must be a whole number")).toBeInTheDocument()
  })

  it("rejects a fractional barcode value (backend barcode is a Long)", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.type(screen.getByLabelText(/Barcode$/), "123.5")
    await user.click(nextButton())

    expect(await screen.findByText("Barcode must be a whole number")).toBeInTheDocument()
  })

  it("rejects a barcode beyond JS's safe-integer precision (backend barcode is a 64-bit Long)", async () => {
    // A number this long still looks like a valid integer client-side, but JS can only carry ~16
    // digits of integer precision; the value that would actually be sent silently differs from
    // what was typed. Real barcode formats (EAN-13/UPC-A/GTIN-14) never reach 17 digits.
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.type(screen.getByLabelText(/Barcode$/), "99999999999999999")
    await user.click(nextButton())

    expect(await screen.findByText("Barcode is too large to submit accurately")).toBeInTheDocument()
  })

  it("accepts a 14-digit barcode (GTIN-14), the longest real-world barcode format", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.type(screen.getByLabelText(/Barcode$/), "12345678901234")
    await user.click(nextButton())

    expect(await screen.findByLabelText("Detailed Description *")).toBeInTheDocument()
    expect(screen.queryByText(/^Barcode/)).not.toBeInTheDocument()
  })

  it("rejects a negative price and a negative stock", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
    await user.type(screen.getByLabelText("Price *"), "-5")
    await user.type(screen.getByLabelText("Stock *"), "-1")
    await user.type(screen.getByLabelText("Shipment Fee *"), "5")
    await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
    await user.selectOptions(screen.getByRole("combobox", { name: "Fulfillment Policy *" }), "Ships within 2 days")
    await user.click(nextButton())

    expect(await screen.findByText("Price must be a non-negative number")).toBeInTheDocument()
    expect(screen.getByText("Stock must be a non-negative number")).toBeInTheDocument()
  })

  it("accepts a large price and a decimal price", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
    await user.type(screen.getByLabelText("Price *"), "999999.99")
    await user.type(screen.getByLabelText("Stock *"), "7")
    await user.type(screen.getByLabelText("Shipment Fee *"), "5")
    await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
    await user.selectOptions(screen.getByRole("combobox", { name: "Fulfillment Policy *" }), "Ships within 2 days")
    await user.click(nextButton())

    expect(await screen.findByLabelText("Detailed Description *")).toBeInTheDocument()
  })
})

describe("CreateProductPage — search: infinite scroll and click outside", () => {
  const fireScrollNearBottom = (el: HTMLElement) => {
    Object.defineProperty(el, "scrollHeight", { value: 1000, configurable: true })
    Object.defineProperty(el, "clientHeight", { value: 400, configurable: true })
    Object.defineProperty(el, "scrollTop", { value: 590, configurable: true }) // distance 10px < 48px threshold
    el.dispatchEvent(new Event("scroll", { bubbles: true }))
  }

  it("loads the next page when scrolled near the bottom", async () => {
    const user = userEvent.setup()
    const pagesRequested: number[] = []
    server.use(
      http.get("*/api/products/active", ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page") ?? "0")
        pagesRequested.push(page)
        return HttpResponse.json(
          searchPage([{ id: `p-${page}`, name: `Composite ${page}` }], { last: page >= 1, number: page }),
        )
      }),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await screen.findByText("1 results found", undefined, { timeout: 4000 })

    const list = document.querySelector(".max-h-96.overflow-y-auto") as HTMLElement
    fireScrollNearBottom(list)

    await waitFor(() => expect(pagesRequested).toContain(1), { timeout: 4000 })
    expect(await screen.findByText("Composite 1")).toBeInTheDocument()
  })

  it("stops requesting once the last page has been reached", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () =>
        HttpResponse.json(searchPage([{ id: "p-1", name: "Composite Kit" }], { last: true })),
      ),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await screen.findByText("1 results found", undefined, { timeout: 4000 })

    expect(await screen.findByText("No more results")).toBeInTheDocument()
  })

  it("closes the results dropdown when clicking outside of it", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () => HttpResponse.json(searchPage([{ id: "p-1", name: "Composite Kit" }]))),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await screen.findByText("1 results found", undefined, { timeout: 4000 })

    await user.click(document.body)

    await waitFor(() => expect(screen.queryByText("1 results found")).not.toBeInTheDocument())
  })
})

describe("CreateProductPage — edit mode (loadProductForEdit)", () => {
  it("redirects with a not-found toast when the user-product isn't in the vendor's list", async () => {
    server.use(http.get("*/api/user-products", () => HttpResponse.json([])))

    const { router } = render(<CreateProductPage />, { searchParams: "edit=missing-id" })

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Product not found"))
    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard/products")
  })

  it("redirects with a toast when loading the underlying product fails", async () => {
    server.use(
      http.get("*/api/user-products", () => HttpResponse.json([makeVendorUserProduct({ id: "up-9" })])),
      http.get("*/api/products/:id", () => new HttpResponse(null, { status: 500 })),
    )

    const { router } = render(<CreateProductPage />, { searchParams: "edit=up-9" })

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalled())
    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard/products")
  })

  it("populates price and stock and disables the catalogue fields", async () => {
    server.use(
      http.get("*/api/user-products", () =>
        HttpResponse.json([makeVendorUserProduct({ id: "up-9", price: 56, stock: 40 })]),
      ),
      http.get("*/api/products/:id", ({ params }) =>
        HttpResponse.json(makeProduct({ id: String(params.id), name: "Existing Product" })),
      ),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })

    const priceInput = await screen.findByLabelText("Price *")
    await waitFor(() => expect(priceInput).toHaveValue(56))
    expect(screen.getByLabelText(/Product Name/)).toHaveValue("Existing Product")
    expect(screen.getByLabelText(/Product Name/)).toBeDisabled()
  })
})

describe("CreateProductPage — review-edit mode (loadProductForReviewEdit)", () => {
  it("redirects with a toast when either fetch fails", async () => {
    server.use(
      http.get("*/api/products/:id/owner", () => new HttpResponse(null, { status: 500 })),
      http.get("*/api/user-products/:id", () => HttpResponse.json(makeUserProductDetailResponse({ id: "up-9" }))),
    )

    const { router } = render(<CreateProductPage />, {
      searchParams: "reviewEditId=p-1&reviewUserProductId=up-9",
    })

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalled())
    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard/products")
  })

  it("restores the fulfillment policy from the rejected listing so it isn't silently lost on resubmit", async () => {
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(makeProduct({ id: String(params.id), name: "Rejected Product" })),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({ id: "up-9", fulfillmentPolicy: "Ships within 5 business days" }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })

    await screen.findByLabelText(/Product Name/)
    expect(screen.getByLabelText(/Product Name/)).toHaveValue("Rejected Product")
    expect(screen.getByLabelText("Fulfillment Policy *")).toHaveValue("Ships within 5 days")
  })

  it("shows Resubmit for Review on the submit button once the Media tab is reached", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            name: "Rejected Product",
            description: "desc",
            manufacturerCode: "MNF-1",
            manufacturer: "MARK3",
            brand: "MARK3",
            manufacturerSiteProductPage: "https://example.com/p",
            dentalLicenseRequired: "No",
            coverPhotoPath: "/uploads/existing.png",
            weight: 1,
            categoryLevel1: "Dental Supplies",
            categoryLevel2: "Endodontic products",
            categoryLevel3: "Hand files-reamers-hedstroms",
            categoryLevel4: "K-Files",
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({
            id: "up-9",
            skuCode: "SKU-9",
            price: 10,
            stock: 5,
            shipmentFee: 1,
            heavyShippingSurcharge: 0,
            fulfillmentPolicy: "Ships within 2 business days",
          }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })
    await screen.findByLabelText(/Product Name/)

    await user.click(nextButton())
    await user.click(nextButton())

    expect(await screen.findByRole("button", { name: "Resubmit for Review" })).toBeInTheDocument()
  })

  it("resubmits via PUT /api/products/review/:id with the same required-field contract as create", async () => {
    // A axis: the update path (ProductServiceImpl.updateForReview) runs the exact same validate()
    // as create, but until now no test in this suite ever drove it to a real submission - only to
    // the button label. This closes that gap: method, URL, and the full required-field set.
    const user = userEvent.setup()
    const original = apiRequest.requestJson.bind(apiRequest)
    const requestJson = vi
      .spyOn(apiRequest, "requestJson")
      .mockImplementation((config) =>
        String((config as { url?: string }).url).includes("/api/products/review")
          ? (Promise.resolve(makeProduct()) as never)
          : (original(config as never) as never),
      )
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            name: "Rejected Product",
            description: "desc",
            manufacturerCode: "MNF-1",
            manufacturer: "MARK3",
            brand: "MARK3",
            manufacturerSiteProductPage: "https://example.com/p",
            dentalLicenseRequired: "No",
            coverPhotoPath: "/uploads/existing.png",
            weight: 1,
            categoryLevel1: "Dental Supplies",
            categoryLevel2: "Endodontic products",
            categoryLevel3: "Hand files-reamers-hedstroms",
            categoryLevel4: "K-Files",
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({
            id: "up-9",
            skuCode: "SKU-9",
            price: 10,
            stock: 5,
            shipmentFee: 1,
            heavyShippingSurcharge: 0,
            fulfillmentPolicy: "Ships within 2 business days",
          }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })
    await screen.findByLabelText(/Product Name/)
    await user.click(nextButton())
    await user.click(nextButton())
    await user.click(screen.getByRole("button", { name: "Resubmit for Review" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Product updated and resubmitted for review!"))
    const call = requestJson.mock.calls.find(([c]) =>
      String((c as { url?: string }).url).includes("/api/products/review"),
    )
    const config = call?.[0] as { url: string; method: string; data: FormData }
    expect(config.method).toBe("PUT")
    expect(config.url).toContain("/api/products/review/p-1")
    const json = JSON.parse(String(config.data.get("data"))) as Record<string, unknown>
    expect(json).toMatchObject({
      name: "Rejected Product",
      description: "desc",
      manufacturerCode: "MNF-1",
      manufacturer: "MARK3",
      brand: "MARK3",
      manufacturerSiteProductPage: "https://example.com/p",
      dentalLicenseRequired: "No",
      weight: 1,
      skuCode: "SKU-9",
      price: 10,
      stock: 5,
      shipmentFee: 1,
      heavyShippingSurcharge: 0,
      fulfillmentPolicy: "Ships within 2 days",
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Hand files-reamers-hedstroms",
      categoryLevel4: "K-Files",
    })
    expect(typeof json.active).toBe("boolean")
    expect(typeof json.exportPackaging).toBe("boolean")
  })

  it("shows the stored category path in the picker trigger when it is a valid tree leaf", async () => {
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            categoryLevel1: "Dental Supplies",
            categoryLevel2: "Endodontic products",
            categoryLevel3: "Hand files-reamers-hedstroms",
            categoryLevel4: "K-Files",
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({ id: "up-9", fulfillmentPolicy: "Ships within 2 business days" }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })
    await screen.findByLabelText(/Product Name/)
    await userEvent.setup().click(tabButton("Product Details"))

    expect(await screen.findByRole("combobox", { name: "Category 2" })).toHaveTextContent("Endodontic products")
    expect(screen.getByRole("combobox", { name: "Category 3" })).toHaveTextContent("Hand files-reamers-hedstroms")
    expect(screen.getByRole("combobox", { name: "Category 4" })).toHaveTextContent("K-Files")
    expect(screen.queryByRole("note")).not.toBeInTheDocument()
  })

  it("shows a legacy hint instead of a selection when the stored category is not a tree leaf", async () => {
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            categoryLevel1: "Restorative",
            categoryLevel2: "Composite",
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({ id: "up-9", fulfillmentPolicy: "Ships within 2 business days" }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })
    await screen.findByLabelText(/Product Name/)
    await userEvent.setup().click(tabButton("Product Details"))

    expect(await screen.findByRole("combobox", { name: "Category 2" })).toHaveTextContent("Select…")
    expect(screen.getByRole("note")).toHaveTextContent("Previous: Restorative > Composite")

    // The legacy value is a hint only - it never satisfies the required rule, so moving forward
    // is blocked until the vendor picks a real tree leaf.
    await userEvent.setup().click(tabButton("Media"))
    expect(await screen.findByText("Category is required")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Category 2" })).toBeInTheDocument()
  })

  it("shows no category selection or legacy hint when every stored category level is empty", async () => {
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            categoryLevel1: undefined,
            categoryLevel2: undefined,
            categoryLevel3: undefined,
            categoryLevel4: undefined,
            categoryLevel5: undefined,
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({ id: "up-9", fulfillmentPolicy: "Ships within 2 business days" }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })
    await screen.findByLabelText(/Product Name/)
    await userEvent.setup().click(tabButton("Product Details"))

    expect(await screen.findByRole("combobox", { name: "Category 2" })).toHaveTextContent("Select…")
    expect(screen.queryByRole("combobox", { name: "Category 3" })).not.toBeInTheDocument()
    expect(screen.queryByRole("note")).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — submission robustness", () => {
  it("disables the submit button while a submission is in flight, preventing a double submit", async () => {
    const user = userEvent.setup()
    let resolveRequest: (() => void) | undefined
    const original = apiRequest.requestJson.bind(apiRequest)
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) => {
      const url = String((config as { url?: string }).url)
      if (url.includes("/api/products/review")) {
        return new Promise((resolve) => {
          resolveRequest = () => resolve(makeProduct() as never)
        }) as never
      }
      return original(config as never) as never
    })

    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))
    await fillDetailsTab(user)
    await user.click(tabButton("Media"))
    await attachCoverPhotoFile(user)

    const submit = screen.getByRole("button", { name: "Submit" })
    await user.click(submit)

    expect(screen.getByRole("button", { name: /Submitting/ })).toBeDisabled()

    resolveRequest?.()
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
  })

  it("surfaces a network failure without a message as a generic error", async () => {
    const user = userEvent.setup()
    const original = apiRequest.requestJson.bind(apiRequest)
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) => {
      const url = String((config as { url?: string }).url)
      if (url.includes("/api/products/review")) {
        return Promise.reject(new Error()) as never
      }
      return original(config as never) as never
    })

    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))
    await fillDetailsTab(user)
    await user.click(tabButton("Media"))
    await attachCoverPhotoFile(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("Failed to create product. Please try again.")).toBeInTheDocument()
  })

  it("surfaces the backend's duplicate-barcode message (409 DuplicateBarcodeException)", async () => {
    const user = userEvent.setup()
    const original = apiRequest.requestJson.bind(apiRequest)
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) => {
      const url = String((config as { url?: string }).url)
      if (url.includes("/api/products/review")) {
        return Promise.reject(new Error("A product with this barcode already exists.")) as never
      }
      return original(config as never) as never
    })

    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))
    await fillDetailsTab(user)
    await user.click(tabButton("Media"))
    await attachCoverPhotoFile(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("A product with this barcode already exists.")).toBeInTheDocument()
    expect(toastSpies.error).toHaveBeenCalledWith("A product with this barcode already exists.")
  })
})

describe("CreateProductPage — search result selection populates the modal", () => {
  it("opens the details modal with the fetched product's stock field", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () => HttpResponse.json(searchPage([{ id: "p-1", name: "Composite Kit" }]))),
      http.get("*/api/products/:id", ({ params }) =>
        HttpResponse.json(makeProduct({ id: String(params.id), name: "Composite Kit" })),
      ),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await user.click(await screen.findByRole("button", { name: /Composite Kit/ }, { timeout: 4000 }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByLabelText("Stock *")).toBeInTheDocument()
  })
})

describe("CreateProductPage — Brand field", () => {
  it("hides the 'All Brands' option on the required Details-tab Brand dropdown", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))

    // The Details-tab Brand dropdown is the required, single-value field (rendered with an id) -
    // "All Brands" is a no-op there and would trap a vendor who picks it in a validation loop.
    const requiredBrandCall = brandFilterCalls.find((call) => call.id === "brand")
    expect(requiredBrandCall?.hideAllOption).toBe(true)
  })

  it("keeps the 'All Brands' option on the search-view brand filter", async () => {
    render(<CreateProductPage />)

    // The search-view filter has no `id` and is a real multi-value filter, so "All Brands" stays.
    const searchFilterCall = brandFilterCalls.find((call) => call.id === undefined)
    expect(searchFilterCall?.hideAllOption).toBeFalsy()
  })
})

describe("CreateProductPage — top-level navigation", () => {
  it("sends an unauthenticated vendor to the login page", async () => {
    const user = userEvent.setup()
    useAuthStore.getState().clearAuth()

    const { router } = render(<CreateProductPage />)
    await user.click(screen.getByRole("button", { name: "Go to Login" }))

    expect(router.push).toHaveBeenCalledWith("/login")
  })

  it("sends the vendor back to the product list from Cancel", async () => {
    const user = userEvent.setup()
    const { router } = render(<CreateProductPage />)

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard/products")
  })
})

describe("CreateProductPage — more cover/gallery interaction coverage", () => {
  it("removes a linked cover photo via the X button", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "https://cdn.example/cover.png")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(screen.getByText("Link")).toBeInTheDocument()

    const preview = screen.getByAltText("Cover preview")
    const removeButton = preview.closest(".relative.inline-block")?.querySelector("button") as HTMLElement
    await user.click(removeButton)

    expect(screen.queryByText("Link")).not.toBeInTheDocument()
  })

  it("falls back to a placeholder icon when the cover preview image fails to load", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)
    await attachCoverPhotoFile(user)

    const preview = screen.getByAltText("Cover preview") as HTMLImageElement
    fireEvent.error(preview)

    expect(preview.src).toContain("data:image/svg+xml")
  })

  it("re-opens the file picker from the Change button on an existing cover preview", async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click")
    await openBlankForm(user)
    await reachMediaTab(user)
    await attachCoverPhotoFile(user)
    clickSpy.mockClear()

    await user.click(screen.getByRole("button", { name: "Change" }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it("opens the file picker from the empty-state cover photo dropzone", async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click")
    await openBlankForm(user)
    await reachMediaTab(user)
    clickSpy.mockClear()

    await user.click(screen.getByRole("button", { name: /Click to upload cover photo/ }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it("opens the file picker from the Add Photos button", async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click")
    await openBlankForm(user)
    await reachMediaTab(user)
    clickSpy.mockClear()

    await user.click(screen.getByRole("button", { name: "Add Photos" }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it("switches the additional-photos section back to upload mode", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const photoModeButtons = screen.getAllByRole("button", { name: /Add via Link/ })
    await user.click(photoModeButtons[1] as HTMLElement)
    expect(screen.getByPlaceholderText("https://example.com/image.jpg")).toBeInTheDocument()

    const uploadButtons = screen.getAllByRole("button", { name: /Upload/ })
    await user.click(uploadButtons[1] as HTMLElement)

    expect(screen.getByRole("button", { name: "Add Photos" })).toBeInTheDocument()
  })

  it("falls back to a placeholder icon when a gallery photo fails to load", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const input = document.querySelector("#photosInput") as HTMLInputElement
    await user.upload(input, [new File(["a"], "a.png", { type: "image/png" })])

    const thumb = screen.getByAltText("New 1") as HTMLImageElement
    fireEvent.error(thumb)

    expect(thumb.src).toContain("data:image/svg+xml")
  })

  it("falls back to a placeholder icon when a linked gallery photo fails to load", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const linkButtons = screen.getAllByRole("button", { name: /Add via Link/ })
    await user.click(linkButtons[1] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "https://cdn.example/gallery.png")
    await user.click(screen.getByRole("button", { name: "Add" }))

    const thumb = screen.getByAltText("Linked 1") as HTMLImageElement
    fireEvent.error(thumb)

    expect(thumb.src).toContain("data:image/svg+xml")
  })
})

describe("CreateProductPage — Product Details tab controls", () => {
  it("toggles the Dental License Required switch", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))

    const toggle = screen.getByRole("switch")
    expect(toggle).toHaveAttribute("aria-checked", "false")

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "true")

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "false")
  })

  it("adds a custom attribute row", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))

    await user.click(screen.getByRole("button", { name: /Add Attribute/ }))

    expect(screen.getByPlaceholderText("Attribute name (e.g., Color)")).toBeInTheDocument()
  })
})

describe("CreateProductPage — edit-mode discount field", () => {
  it("clears the discount error once a valid value is typed", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/user-products", () =>
        HttpResponse.json([makeVendorUserProduct({ id: "up-9", price: 56, stock: 40 })]),
      ),
      http.get("*/api/products/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })
    await screen.findByLabelText("Price *")

    const discountInput = screen.getByLabelText(/Discount/) as HTMLInputElement
    await user.clear(discountInput)
    await user.type(discountInput, "-5")
    await user.click(nextButton())
    expect(await screen.findByText("Discount must be a non-negative number")).toBeInTheDocument()

    await user.clear(discountInput)
    await user.type(discountInput, "10")

    expect(screen.queryByText("Discount must be a non-negative number")).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — removing an existing photo in review-edit mode", () => {
  it("removes an existing gallery photo loaded from the rejected product", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            name: "Rejected Product",
            description: "desc",
            manufacturerCode: "MNF-1",
            manufacturer: "MARK3",
            brand: "MARK3",
            manufacturerSiteProductPage: "https://example.com/p",
            dentalLicenseRequired: "No",
            coverPhotoPath: "/uploads/existing-cover.png",
            photoPhats: ["/uploads/existing-1.png", "/uploads/existing-2.png"],
            weight: 1,
            categoryLevel1: "Dental Supplies",
            categoryLevel2: "Endodontic products",
            categoryLevel3: "Hand files-reamers-hedstroms",
            categoryLevel4: "K-Files",
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({
            id: "up-9",
            skuCode: "SKU-9",
            price: 10,
            stock: 5,
            shipmentFee: 1,
            heavyShippingSurcharge: 0,
            fulfillmentPolicy: "Ships within 2 business days",
          }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })
    await screen.findByLabelText(/Product Name/)
    await user.click(nextButton())
    await user.click(nextButton())

    expect(screen.getByText("Existing photos: 2 image(s)")).toBeInTheDocument()
    const existingImage = screen.getByAltText("Existing 1")
    const removeButton = existingImage.closest(".group")?.querySelector("button") as HTMLElement
    await user.click(removeButton)

    expect(screen.getByText("Existing photos: 1 image(s)")).toBeInTheDocument()
  })
})

describe("CreateProductPage — search dropdown broken thumbnail", () => {
  it("falls back to a placeholder icon when a search result thumbnail fails to load", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () =>
        HttpResponse.json({
          content: [{ id: "p-1", name: "Composite Kit", brand: "MARK3", coverPhotoPath: "/uploads/tips.png" }],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10,
          numberOfElements: 1,
          first: true,
          last: true,
          empty: false,
        }),
      ),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    const thumb = await screen.findByAltText("Composite Kit", undefined, { timeout: 4000 })
    fireEvent.error(thumb)

    // The broken thumbnail is swapped for the generic image-icon placeholder, not left blank.
    expect(screen.queryByAltText("Composite Kit")).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — details modal onClose", () => {
  it("closes the product details modal from its Cancel button", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () =>
        HttpResponse.json({
          content: [{ id: "p-1", name: "Composite Kit", brand: "MARK3", coverPhotoPath: null }],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10,
          numberOfElements: 1,
          first: true,
          last: true,
          empty: false,
        }),
      ),
      http.get("*/api/products/:id", ({ params }) =>
        HttpResponse.json(makeProduct({ id: String(params.id), name: "Composite Kit" })),
      ),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await user.click(await screen.findByRole("button", { name: /Composite Kit/ }, { timeout: 4000 }))

    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — loading with partial backend data", () => {
  it("loads a review-edit product that is missing every optional field", async () => {
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            name: "Bare Product",
            detailedName: undefined,
            barcode: 0,
            barcodeFormats: undefined,
            brand: undefined,
            coverPhotoPath: undefined,
            photoPhats: undefined,
            height: undefined,
            length: undefined,
            width: undefined,
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({
            id: "up-9",
            skuCode: undefined,
            shipmentFee: undefined,
            heavyShippingSurcharge: undefined,
            fulfillmentPolicy: undefined,
          }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })

    const nameInput = await screen.findByLabelText(/Product Name/)
    expect(nameInput).toHaveValue("Bare Product")
    expect(screen.getByLabelText("Fulfillment Policy *")).toHaveValue("")
  })

  it("loads an edit-mode listing whose underlying product is missing optional fields", async () => {
    server.use(
      http.get("*/api/user-products", () =>
        HttpResponse.json([makeVendorUserProduct({ id: "up-9", price: 56, stock: 40 })]),
      ),
      http.get("*/api/products/:id", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            name: "Bare Product",
            detailedName: undefined,
            barcodeFormats: undefined,
            brand: undefined,
            coverPhotoPath: undefined,
            photoPhats: undefined,
            description: undefined,
            manufacturerCode: undefined,
          }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })

    const nameInput = await screen.findByLabelText(/Product Name/)
    await waitFor(() => expect(nameInput).toHaveValue("Bare Product"))
  })
})

describe("CreateProductPage — more numeric/validation branches", () => {
  it("rejects a fractional or negative stock while editing an existing listing", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/user-products", () =>
        HttpResponse.json([makeVendorUserProduct({ id: "up-9", price: 56, stock: 40 })]),
      ),
      http.get("*/api/products/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })
    const stockInput = await screen.findByLabelText("Stock *")

    await user.clear(stockInput)
    await user.type(stockInput, "7.5")
    await user.click(nextButton())

    expect(await screen.findByText("Stock must be a whole number")).toBeInTheDocument()
  })

  it("rejects a negative price while editing an existing listing", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/user-products", () =>
        HttpResponse.json([makeVendorUserProduct({ id: "up-9", price: 56, stock: 40 })]),
      ),
      http.get("*/api/products/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })
    const priceInput = await screen.findByLabelText("Price *")

    await user.clear(priceInput)
    await user.type(priceInput, "-5")
    await user.click(nextButton())

    expect(await screen.findByText("Price must be a non-negative number")).toBeInTheDocument()
  })
})

describe("CreateProductPage — checkbox fields", () => {
  it("toggles the Product is Active checkbox", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    const activeCheckbox = screen.getByRole("checkbox", { name: "Product is Active" })
    expect(activeCheckbox).toBeChecked()

    await user.click(activeCheckbox)
    expect(activeCheckbox).not.toBeChecked()
  })

  it("toggles the Export Packaging checkbox", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    const exportCheckbox = screen.getByRole("checkbox", { name: "Export Packaging" })
    expect(exportCheckbox).not.toBeChecked()

    await user.click(exportCheckbox)
    expect(exportCheckbox).toBeChecked()
  })
})

describe("CreateProductPage — replacing and removing cover photos", () => {
  it("revokes the previous preview URL when a second file replaces the first", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await attachCoverPhotoFile(user, "first.png")
    ;(URL.revokeObjectURL as ReturnType<typeof vi.fn>).mockClear()
    await user.click(screen.getByRole("button", { name: "Change" }))
    await attachCoverPhotoFile(user, "second.png")

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview")
    expect(screen.getByText(/second\.png \(new\)/)).toBeInTheDocument()
  })

  it("removes an existing cover photo carried over from a rejected product", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/:id/owner", ({ params }) =>
        HttpResponse.json(
          makeProduct({
            id: String(params.id),
            name: "Rejected Product",
            description: "desc",
            manufacturerCode: "MNF-1",
            manufacturer: "MARK3",
            brand: "MARK3",
            manufacturerSiteProductPage: "https://example.com/p",
            dentalLicenseRequired: "No",
            coverPhotoPath: "/uploads/existing-cover.png",
            photoPhats: [],
            weight: 1,
            categoryLevel1: "Dental Supplies",
            categoryLevel2: "Endodontic products",
            categoryLevel3: "Hand files-reamers-hedstroms",
            categoryLevel4: "K-Files",
          }),
        ),
      ),
      http.get("*/api/user-products/:id", () =>
        HttpResponse.json(
          makeUserProductDetailResponse({
            id: "up-9",
            skuCode: "SKU-9",
            price: 10,
            stock: 5,
            shipmentFee: 1,
            heavyShippingSurcharge: 0,
            fulfillmentPolicy: "Ships within 2 business days",
          }),
        ),
      ),
    )

    render(<CreateProductPage />, { searchParams: "reviewEditId=p-1&reviewUserProductId=up-9" })
    await screen.findByLabelText(/Product Name/)
    await user.click(nextButton())
    await user.click(nextButton())

    expect(screen.getByText("Existing")).toBeInTheDocument()
    const preview = screen.getByAltText("Cover preview")
    const removeButton = preview.closest(".relative.inline-block")?.querySelector("button") as HTMLElement
    await user.click(removeButton)

    expect(screen.queryByText("Cover photo: Existing image")).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — gallery link validation and error clearing", () => {
  it("rejects a non-http(s) URL for an additional photo link", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const linkButtons = screen.getAllByRole("button", { name: /Add via Link/ })
    await user.click(linkButtons[1] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "ftp://example.com/a.png")
    await user.click(screen.getByRole("button", { name: "Add" }))

    expect(
      await screen.findByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).toBeInTheDocument()
  })

  it("clears the cover photo link error as soon as the vendor edits the URL", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    const urlInput = screen.getByPlaceholderText("https://example.com/image.jpg")
    await user.type(urlInput, "not-a-url")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(
      await screen.findByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).toBeInTheDocument()

    await user.type(urlInput, "x")

    expect(
      screen.queryByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).not.toBeInTheDocument()
  })

  it("clears the additional-photo link error as soon as the vendor edits the URL", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const linkButtons = screen.getAllByRole("button", { name: /Add via Link/ })
    await user.click(linkButtons[1] as HTMLElement)
    const urlInput = screen.getByPlaceholderText("https://example.com/image.jpg")
    await user.type(urlInput, "not-a-url")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(
      await screen.findByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).toBeInTheDocument()

    await user.type(urlInput, "x")

    expect(
      screen.queryByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).not.toBeInTheDocument()
  })
})

describe("CreateProductPage — search results with sparse data", () => {
  it("shows a generic name and hides the barcode/category rows when the search item lacks them", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () =>
        HttpResponse.json({
          content: [{ id: "p-1", name: "", brand: null, coverPhotoPath: null }],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10,
          numberOfElements: 1,
          first: true,
          last: true,
          empty: false,
        }),
      ),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")

    expect(await screen.findByText("Unnamed Product")).toBeInTheDocument()
  })
})

describe("CreateProductPage — malformed active-search response (C axis)", () => {
  // The BFF (`/api/products/active/route.ts`) passes a successful upstream body through verbatim
  // with no shape validation, so a degenerate 200 - `content` missing, null, or not an array -
  // reaches performSearch as-is. An unguarded `.map` over it throws inside the try block and
  // surfaces as a raw JS error message via the "Search error: ..." toast instead of a clean result
  // or status - not a white screen here (it's caught), but not an understandable message either.
  it("shows no results instead of a raw JS error when `content` is missing from a 200", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () =>
        HttpResponse.json({ totalElements: 0, totalPages: 0, number: 0, size: 10, last: true, empty: true }),
      ),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")

    // A missing `content` is treated as a real (empty) page, not swallowed into a caught
    // exception - so the "no results" empty state renders instead of nothing at all.
    expect(await screen.findByText("No results found", undefined, { timeout: 4000 })).toBeInTheDocument()
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("shows no results instead of crashing when `content` is null", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/products/active", () =>
        HttpResponse.json({ content: null, totalElements: 0, totalPages: 0, number: 0, size: 10, last: true }),
      ),
    )

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")

    expect(await screen.findByText("No results found", undefined, { timeout: 4000 })).toBeInTheDocument()
    expect(toastSpies.error).not.toHaveBeenCalled()
  })
})

describe("CreateProductPage — attributes in the submitted payload", () => {
  it("includes a filled-in custom attribute in the review payload", async () => {
    const user = userEvent.setup()
    const original = apiRequest.requestJson.bind(apiRequest)
    const requestJson = vi
      .spyOn(apiRequest, "requestJson")
      .mockImplementation((config) =>
        String((config as { url?: string }).url).includes("/api/products/review")
          ? (Promise.resolve(makeProduct()) as never)
          : (original(config as never) as never),
      )

    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))
    await fillDetailsTab(user)
    await user.click(screen.getByRole("button", { name: /Add Attribute/ }))
    await user.type(screen.getByPlaceholderText("Attribute name (e.g., Color)"), "Color")
    await user.type(screen.getByPlaceholderText("Attribute value (e.g., Blue)"), "Blue")
    await user.click(tabButton("Media"))
    await attachCoverPhotoFile(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const call = requestJson.mock.calls.find(([c]) =>
      String((c as { url?: string }).url).includes("/api/products/review"),
    )
    const data = (call?.[0] as { data: FormData }).data
    const json = JSON.parse(String(data.get("data"))) as Record<string, unknown>
    expect(json.attributes).toEqual([{ attributeName: "Color", attributeValue: "Blue" }])
  })
})

// The backend has NO multipart override, so Spring Boot 3.5.7 defaults apply: 1MB per file and
// 10MB per request. Before this guard a vendor's ordinary 3MB phone photo was accepted by the form,
// sent, and bounced by the server with an opaque "Maximum upload size exceeded" 400 - while the UI
// copy promised 10MB. These tests pin the frontend to the real server limits.
describe("CreateProductPage - upload size limits", () => {
  it("rejects a cover photo larger than the 1MB the server accepts, naming the file and the limit", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const input = document.querySelector("#coverPhotoInput") as HTMLInputElement
    await user.upload(input, sizedFile("huge-cover.png", 3 * 1024 * 1024))

    expect(toastSpies.error).toHaveBeenCalledWith("Photo is too large", expect.stringContaining("huge-cover.png"))
    expect(toastSpies.error).toHaveBeenCalledWith("Photo is too large", expect.stringContaining("1MB"))
  })

  it("accepts a cover photo at exactly the 1MB ceiling", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const input = document.querySelector("#coverPhotoInput") as HTMLInputElement
    await user.upload(input, sizedFile("exact.png", 1024 * 1024))

    expect(toastSpies.error).not.toHaveBeenCalledWith("Photo is too large", expect.anything())
  })

  it("names every oversized gallery photo rather than only the first", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const input = document.querySelector("#photosInput") as HTMLInputElement
    await user.upload(input, [sizedFile("big-a.png", 2 * 1024 * 1024), sizedFile("big-b.png", 2 * 1024 * 1024)])

    expect(toastSpies.error).toHaveBeenCalledWith("Some photos are too large", expect.stringContaining("big-a.png"))
    expect(toastSpies.error).toHaveBeenCalledWith("Some photos are too large", expect.stringContaining("big-b.png"))
  })

  // Each generated file must individually stay at or under the 1MB per-file cap, or it trips the
  // per-file rejection instead of the total-request one being exercised here.
  const ONE_MB = 1024 * 1024
  const filesOfTotal = (prefix: string, totalBytes: number) => {
    const files: File[] = []
    let remaining = totalBytes
    let i = 0
    while (remaining > 0) {
      const size = Math.min(remaining, ONE_MB)
      files.push(sizedFile(`${prefix}${i}.png`, size))
      remaining -= size
      i += 1
    }
    return files
  }

  it("rejects gallery photos that individually pass the 1MB cap but push the 10MB request total over", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const galleryInput = document.querySelector("#photosInput") as HTMLInputElement
    await user.upload(galleryInput, filesOfTotal("g", 10 * ONE_MB + 1)) // 1 byte over the 10MB request cap

    expect(toastSpies.error).toHaveBeenCalledWith("Photos are too large together", expect.stringContaining("10MB"))
    expect(screen.queryByText(/New photos:/)).not.toBeInTheDocument()
  })

  it("rejects a cover-photo swap (via Change) that would push an already-near-the-limit gallery over 10MB total", async () => {
    // Regression: the per-request 10MB check used to live only in the gallery handler. A vendor
    // who fills the gallery close to the ceiling first and then uses "Change" to replace the
    // cover photo never passed through that handler, so the swap was silently accepted client-side
    // even though the combined multipart request would blow the server's 10MB limit.
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const galleryInput = document.querySelector("#photosInput") as HTMLInputElement
    await user.upload(galleryInput, filesOfTotal("g", 9 * ONE_MB + 2)) // just over 9MB, still < 10MB alone

    const coverInput = document.querySelector("#coverPhotoInput") as HTMLInputElement
    await user.upload(coverInput, sizedFile("cover.png", ONE_MB)) // 1MB, at the per-file cap; total tips over 10MB

    expect(toastSpies.error).toHaveBeenCalledWith("Photos are too large together", expect.stringContaining("10MB"))
    expect(screen.queryByText("New Cover")).not.toBeInTheDocument()
  })

  it("accepts a cover-photo swap that keeps the combined request at or under 10MB", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await reachMediaTab(user)

    const galleryInput = document.querySelector("#photosInput") as HTMLInputElement
    await user.upload(galleryInput, [sizedFile("g1.png", 3 * ONE_MB)]) // 3MB of gallery photos

    const coverInput = document.querySelector("#coverPhotoInput") as HTMLInputElement
    await user.upload(coverInput, sizedFile("cover.png", ONE_MB)) // total 4MB, well under 10MB

    expect(toastSpies.error).not.toHaveBeenCalledWith("Photos are too large together", expect.anything())
    expect(screen.getByText("New Cover")).toBeInTheDocument()
  })
})
