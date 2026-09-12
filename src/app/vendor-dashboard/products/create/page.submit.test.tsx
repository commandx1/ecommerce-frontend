import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/lib/api/request"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import CreateProductPage from "./page"

// This file drives the full 17-field, three-tab create-product form through userEvent, so its
// slowest cases legitimately take ~1.8s in isolation. Under the full suite's parallel worker load
// that stretches past the 5s default and the whole file fails on timeouts — nine of them in the
// gate run on 27 Aug 2026, with zero assertion failures. The work is real, so the budget is
// raised to match it rather than the tests being retried or trimmed. Same reasoning as the
// Playwright `workers=3` decision: match capacity, do not mask contention.
// If a test here ever exceeds this, that is a genuine slowdown worth investigating.
vi.setConfig({ testTimeout: 20_000 })

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
// Brand is now a required field, so the mock needs to behave like a real controlled input.
// The search view also renders BrandFilterDropdown without an `id`; only give it an
// aria-label when `id` is present so `getByLabelText("Brand")` in the form stays unambiguous.
vi.mock("./components/BrandFilterDropdown", () => ({
  default: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id?: string
    value: string | null
    onChange: (v: string | null) => void
    disabled?: boolean
  }) =>
    id ? (
      <input
        id={id}
        aria-label="Brand"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
      />
    ) : null,
}))

/**
 * `createProductForReview` sends multipart/form-data. An MSW round-trip of a FormData body
 * hangs indefinitely in jsdom, so the wire contract is asserted on `apiRequest.requestJson`
 * instead (see TEST-FINDINGS §5).
 */
const spyOnRequestJson = () => {
  const original = apiRequest.requestJson.bind(apiRequest)
  return vi
    .spyOn(apiRequest, "requestJson")
    .mockImplementation((config) =>
      String((config as { url?: string }).url).includes("/api/products/review")
        ? (Promise.resolve(makeProduct()) as never)
        : (original(config as never) as never),
    )
}

const readReviewPayload = (spy: ReturnType<typeof spyOnRequestJson>) => {
  const call = spy.mock.calls.find(([args]) => String((args as { url?: string }).url).includes("/api/products/review"))
  if (!call) return null
  const config = call[0] as { url: string; method: string; data?: FormData }
  const data = config.data as FormData
  return {
    url: config.url,
    method: config.method,
    json: JSON.parse(String(data.get("data"))) as Record<string, unknown>,
    coverPhoto: data.get("coverPhoto"),
    photos: data.getAll("photos"),
  }
}

const calledReviewEndpoint = (spy: ReturnType<typeof spyOnRequestJson>) =>
  spy.mock.calls.some(([config]) => String((config as { url?: string }).url).includes("/api/products/review"))

const openBlankForm = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<CreateProductPage />)
  await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
  await user.click(
    await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
  )
}

/** Tab headers get an appended "N errors" a11y label once a tab has errors, so match by prefix. */
const tabButton = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}`) })

/** Fills every required Basic-tab field; leaves the form on the Basic tab. */
const fillBasicTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
  await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
  await user.type(screen.getByLabelText("Price *"), "42")
  await user.type(screen.getByLabelText("Stock *"), "7")
  await user.type(screen.getByLabelText("Shipment Fee *"), "5")
  await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
  await user.selectOptions(screen.getByRole("combobox", { name: "Fulfillment Policy *" }), "Ships within 2 days")
}

const K_FILES_LABEL = "Endodontic products > Hand files-reamers-hedstroms > K-Files"

const selectCategory = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByLabelText("Category *"))
  await user.type(screen.getByPlaceholderText("Search categories…"), "k-files")
  await user.click(await screen.findByRole("option", { name: K_FILES_LABEL }))
}

/** Fills every required Details-tab field; leaves the form on the Details tab. */
const fillDetailsTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Detailed Description *"), "A great dental product")
  await user.type(screen.getByLabelText("Manufacturer Code *"), "MNF-1")
  await user.type(screen.getByLabelText("Manufacturer *"), "MARK3")
  await user.type(screen.getByLabelText("Brand"), "Acme Dental")
  await selectCategory(user)
  await user.type(screen.getByLabelText("Manufacturer Site Product Page *"), "https://example.com/products/item")
  await user.type(screen.getByLabelText("Weight *"), "1.5")
}

/**
 * Fills every required field across all three tabs, navigating forward via the tab headers
 * (Basic must be valid before "Next"/"Product Details" unlocks Details, same for Media).
 * `coverPhoto` controls how the Media tab's required cover photo is satisfied:
 * "upload" (default) attaches a file, "link" adds an image URL, "none" leaves the form on the
 * Media tab without a cover photo (for tests that assert the missing-cover-photo behavior).
 */
const fillRequiredFields = async (
  user: ReturnType<typeof userEvent.setup>,
  options: { coverPhoto?: "upload" | "link" | "none" } = {},
) => {
  const coverPhoto = options.coverPhoto ?? "upload"

  await fillBasicTab(user)
  await user.click(tabButton("Product Details"))
  await fillDetailsTab(user)
  await user.click(tabButton("Media"))

  if (coverPhoto === "upload") {
    const file = new File(["cover-bytes"], "cover.png", { type: "image/png" })
    const fileInput = document.querySelector("#coverPhotoInput") as HTMLInputElement
    await user.upload(fileInput, file)
  } else if (coverPhoto === "link") {
    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "https://cdn.example/cover.png")
    await user.click(screen.getByRole("button", { name: "Add" }))
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  // jsdom implements neither of these; the media tab calls them for image previews.
  URL.createObjectURL = vi.fn(() => "blob:preview")
  URL.revokeObjectURL = vi.fn()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("CreateProductPage — submitting a new product", () => {
  it("submits a manually entered product for review", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Product submitted for review!"))

    const payload = readReviewPayload(requestJson)
    expect(payload?.method).toBe("POST")
    expect(payload?.url).toContain("/api/products/review")
    expect(payload?.json).toMatchObject({
      name: "Composite Kit",
      price: 42,
      stock: 7,
      skuCode: "SKU-1",
      active: true,
      barcodeFormats: "EAN_13",
    })
  })

  it("omits blank optional fields instead of sending empty strings", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())

    const json = readReviewPayload(requestJson)?.json ?? {}
    expect(json).not.toHaveProperty("detailedName")
    expect(json).not.toHaveProperty("height")
    expect(json).not.toHaveProperty("attributes")
    expect(json).not.toHaveProperty("exampleVariationsProductId")
  })

  it("carries the details tab's values into the payload", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    expect(readReviewPayload(requestJson)?.json).toMatchObject({ manufacturer: "MARK3", weight: 1.5 })
  })

  it("sends the vendor to the product list after a successful submission", async () => {
    const user = userEvent.setup()
    spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
  })

  it("keeps the vendor on the form and shows the reason when the backend rejects it", async () => {
    const user = userEvent.setup()
    const original = apiRequest.requestJson.bind(apiRequest)
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) =>
      String((config as { url?: string }).url).includes("/api/products/review")
        ? (Promise.reject(new Error("Barcode already registered")) as never)
        : (original(config as never) as never),
    )

    await openBlankForm(user)
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("Barcode already registered")).toBeInTheDocument()
    expect(toastSpies.error).toHaveBeenCalledWith("Barcode already registered")

    // Submission failure doesn't move the active tab, so go back to Basic (always allowed) to check.
    await user.click(tabButton("Basic Information"))
    expect(screen.getByLabelText(/Product Name/)).toHaveValue("Composite Kit")
  })

  it("does not call the API when required fields are missing", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    // Reach Media with a valid Basic + Details but no cover photo.
    await fillRequiredFields(user, { coverPhoto: "none" })
    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("Cover photo is required")).toBeInTheDocument()
    expect(calledReviewEndpoint(requestJson)).toBe(false)
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("attaches an uploaded cover photo to the multipart payload", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user, { coverPhoto: "upload" })

    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const payload = readReviewPayload(requestJson)
    expect((payload?.coverPhoto as File)?.name).toBe("cover.png")
  })

  it("rejects a cover photo link that is not an http(s) URL", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    // Reach the Media tab legitimately: Basic and Details must be valid first.
    await fillRequiredFields(user, { coverPhoto: "none" })

    // The first "Add via Link" belongs to the cover photo fieldset
    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "ftp://example.com/a.png")
    await user.click(screen.getByRole("button", { name: "Add" }))

    expect(
      await screen.findByText("Please enter a valid image URL (starting with http:// or https://)"),
    ).toBeInTheDocument()
  })

  it("sends a linked cover photo as a path rather than a file", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user, { coverPhoto: "link" })

    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const payload = readReviewPayload(requestJson)
    expect(payload?.json).toMatchObject({ coverPhotoPath: "https://cdn.example/cover.png" })
    expect(payload?.coverPhoto).toBeNull()
  })

  it("sends every field ProductServiceImpl.validate() requires, with the backend's exact key names and types", async () => {
    // A axis: cross-checked field-by-field against ecommerce-api's ProductVendorRequestDto +
    // ProductServiceImpl.validate() (backend source, not assumed). coverPhotoPath is intentionally
    // absent here - it's only required when no file part is uploaded (resolveCoverPhoto falls back
    // to it), and this test uploads a real file, covered by the "attaches an uploaded cover photo"
    // test above.
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const json = readReviewPayload(requestJson)?.json ?? {}

    expect(json).toMatchObject({
      name: "Composite Kit",
      description: "A great dental product",
      manufacturerCode: "MNF-1",
      manufacturer: "MARK3",
      brand: "Acme Dental",
      manufacturerSiteProductPage: "https://example.com/products/item",
      dentalLicenseRequired: "No",
      weight: 1.5,
      skuCode: "SKU-1",
      price: 42,
      stock: 7,
      active: true,
      shipmentFee: 5,
      heavyShippingSurcharge: 3,
      exportPackaging: false,
      fulfillmentPolicy: "Ships within 2 days",
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Hand files-reamers-hedstroms",
      categoryLevel4: "K-Files",
    })
    expect(typeof json.price).toBe("number")
    expect(typeof json.stock).toBe("number")
    expect(Number.isInteger(json.stock)).toBe(true)
    expect(typeof json.active).toBe("boolean")
    expect(typeof json.exportPackaging).toBe("boolean")
    expect(json).not.toHaveProperty("categoryLevel5")
  })

  it("creates only a vendor listing when an existing catalogue product is selected", async () => {
    let listingPayload: Record<string, unknown> | null = null
    server.use(
      http.post("*/api/user-products", async ({ request }) => {
        listingPayload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: "up-1" })
      }),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })

    // The edit flow lands directly on the form with the listing preloaded
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Search Product" })).not.toBeInTheDocument())
    expect(listingPayload).toBeNull()
  })
})
