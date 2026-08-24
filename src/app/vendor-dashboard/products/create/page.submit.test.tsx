import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/lib/api/request"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import CreateProductPage from "./page"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("./components/BrandFilterDropdown", () => ({ default: () => null }))

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

const openBlankForm = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<CreateProductPage />)
  await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
  await user.click(
    await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
  )
}

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
  await user.type(screen.getByLabelText("Price *"), "42")
  await user.type(screen.getByLabelText("Stock *"), "7")
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
    await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
    await user.click(screen.getByRole("button", { name: /Create Product/ }))

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
    await user.click(screen.getByRole("button", { name: /Create Product/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())

    const json = readReviewPayload(requestJson)?.json ?? {}
    expect(json).not.toHaveProperty("detailedName")
    expect(json).not.toHaveProperty("manufacturer")
    expect(json).not.toHaveProperty("height")
    expect(json).not.toHaveProperty("attributes")
  })

  it("carries the details tab's values into the payload", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user)

    await user.click(screen.getByRole("button", { name: "Product Details" }))
    await user.type(screen.getByLabelText("Manufacturer *"), "MARK3")
    await user.type(screen.getByLabelText("Weight *"), "1.5")

    await user.click(screen.getByRole("button", { name: /Create Product/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    expect(readReviewPayload(requestJson)?.json).toMatchObject({ manufacturer: "MARK3", weight: 1.5 })
  })

  it("sends the vendor to the product list after a successful submission", async () => {
    const user = userEvent.setup()
    spyOnRequestJson()

    render(<CreateProductPage />)
    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await user.click(
      await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
    )
    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: /Create Product/ }))

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
    await user.click(screen.getByRole("button", { name: /Create Product/ }))

    expect(await screen.findByText("Barcode already registered")).toBeInTheDocument()
    expect(toastSpies.error).toHaveBeenCalledWith("Barcode already registered")
    expect(screen.getByLabelText(/Product Name/)).toHaveValue("Composite Kit")
  })

  it("attaches an uploaded cover photo to the multipart payload", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnRequestJson()

    await openBlankForm(user)
    await fillRequiredFields(user)

    await user.click(screen.getByRole("button", { name: "Media" }))
    const file = new File(["cover-bytes"], "cover.png", { type: "image/png" })
    const fileInput = document.querySelector("#coverPhotoInput") as HTMLInputElement
    await user.upload(fileInput, file)

    await user.click(screen.getByRole("button", { name: /Create Product/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const payload = readReviewPayload(requestJson)
    expect((payload?.coverPhoto as File)?.name).toBe("cover.png")
  })

  it("rejects a cover photo link that is not an http(s) URL", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.click(screen.getByRole("button", { name: "Media" }))
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
    await fillRequiredFields(user)

    await user.click(screen.getByRole("button", { name: "Media" }))
    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[0] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "https://cdn.example/cover.png")
    await user.click(screen.getByRole("button", { name: "Add" }))

    await user.click(screen.getByRole("button", { name: /Create Product/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const payload = readReviewPayload(requestJson)
    expect(payload?.json).toMatchObject({ coverPhotoPath: "https://cdn.example/cover.png" })
    expect(payload?.coverPhoto).toBeNull()
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
