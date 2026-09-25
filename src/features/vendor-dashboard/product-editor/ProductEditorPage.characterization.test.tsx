import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFullImageUrl } from "@/lib/api/products"
import { apiRequest } from "@/lib/api/request"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct, makeUserProductDetailResponse, makeVendorUserProduct } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor } from "@/test/render"
import CreateProductPage from "./ProductEditorPage"

// Pins the exact wire contracts and request counts of every save path before the editor is split
// into lib/hooks/components (design S10). The older page suites assert with `toMatchObject`;
// these use exact equality and key order, so a silently added/dropped/reordered field fails here.

installRadixPointerPolyfills()
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
vi.mock("./components/BrandFilterDropdown", () => ({
  default: ({ id, value, onChange }: { id?: string; value: string | null; onChange: (v: string | null) => void }) =>
    id ? (
      <input id={id} aria-label="Brand" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} />
    ) : null,
}))

/** Just the recorded arguments of a spy; avoids fighting generic `MockInstance` signatures. */
type RecordedCalls = { mock: { calls: unknown[][] } }

const nextButton = () => screen.getByRole("button", { name: "Next" })
const tabButton = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}`) })

const reviewRequests = (spy: RecordedCalls) =>
  spy.mock.calls
    .map(([config]) => config as { url: string; method: string; data?: FormData })
    .filter((config) => String(config.url).includes("/api/products/review"))

const spyOnReviewRequests = () => {
  const original = apiRequest.requestJson.bind(apiRequest)
  return vi
    .spyOn(apiRequest, "requestJson")
    .mockImplementation((config) =>
      String((config as { url?: string }).url).includes("/api/products/review")
        ? (Promise.resolve(makeProduct()) as never)
        : (original(config as never) as never),
    )
}

const expectProductsPageCachesInvalidated = (invalidate: RecordedCalls) => {
  const keys = invalidate.mock.calls.map(([filters]) => (filters as { queryKey: unknown }).queryKey)
  expect(keys).toEqual([queryKeys.vendor.products.brands(), queryKeys.vendor.products.stats()])
}

beforeEach(() => {
  vi.restoreAllMocks()
  let previews = 0
  URL.createObjectURL = vi.fn(() => `blob:preview-${++previews}`)
  URL.revokeObjectURL = vi.fn()
  for (const spy of Object.values(toastSpies)) spy.mockClear()
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("ProductEditorPage characterization — plain edit (updateListing)", () => {
  const serveListing = (discount: number) => {
    const counts = { list: 0, product: 0 }
    let body: unknown = null
    server.use(
      http.get("*/api/user-products", () => {
        counts.list += 1
        return HttpResponse.json([
          makeVendorUserProduct({ id: "up-9", productId: "p-7", price: 56, stock: 40, discount }),
        ])
      }),
      http.get("*/api/products/:id", ({ params }) => {
        counts.product += 1
        return HttpResponse.json(makeProduct({ id: String(params.id) }))
      }),
      http.put("*/api/user-products/:id", async ({ request, params }) => {
        body = { id: params.id, json: await request.json() }
        return HttpResponse.json(makeVendorUserProduct({ id: String(params.id) }))
      }),
    )
    return { counts, body: () => body }
  }

  it("loads with one list request and one product request, then PUTs exactly price/discount/stock/active", async () => {
    const user = userEvent.setup()
    const api = serveListing(20)
    const { router, queryClient } = render(<CreateProductPage />, { searchParams: "edit=up-9" })
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    await waitFor(() => expect(screen.getByLabelText("Price *")).toHaveValue(56))
    expect(screen.getByLabelText(/Discount/)).toHaveValue(20)
    expect(api.counts).toEqual({ list: 1, product: 1 })

    await user.clear(screen.getByLabelText("Stock *"))
    await user.type(screen.getByLabelText("Stock *"), "12")
    await user.click(nextButton())
    await user.click(nextButton())
    await user.click(screen.getByRole("button", { name: "Update Product" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Product updated successfully!"))
    expect(api.body()).toEqual({ id: "up-9", json: { price: 56, discount: 20, stock: 12, active: true } })
    expect(Object.keys((api.body() as { json: object }).json)).toEqual(["price", "discount", "stock", "active"])
    expectProductsPageCachesInvalidated(invalidate)
    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard/products")
    expect(api.counts).toEqual({ list: 1, product: 1 })
  })

  it("sends a blank discount as 0", async () => {
    const user = userEvent.setup()
    const api = serveListing(20)
    render(<CreateProductPage />, { searchParams: "edit=up-9" })

    await waitFor(() => expect(screen.getByLabelText(/Discount/)).toHaveValue(20))
    await user.clear(screen.getByLabelText(/Discount/))
    await user.click(nextButton())
    await user.click(nextButton())
    await user.click(screen.getByRole("button", { name: "Update Product" }))

    await waitFor(() => expect(api.body()).not.toBeNull())
    expect((api.body() as { json: { discount: number } }).json.discount).toBe(0)
  })

  it("reports a message-less failure as a generic update error and stays on the form", async () => {
    const user = userEvent.setup()
    serveListing(0)
    const original = apiRequest.requestJson.bind(apiRequest)
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) =>
      (config as { method?: string }).method === "PUT"
        ? (Promise.reject(new Error()) as never)
        : (original(config as never) as never),
    )
    const { router } = render(<CreateProductPage />, { searchParams: "edit=up-9" })

    await waitFor(() => expect(screen.getByLabelText("Price *")).toHaveValue(56))
    await user.click(nextButton())
    await user.click(nextButton())
    await user.click(screen.getByRole("button", { name: "Update Product" }))

    expect(await screen.findByText("Failed to update product. Please try again.")).toBeInTheDocument()
    expect(toastSpies.error).toHaveBeenCalledWith("Failed to update product. Please try again.")
    expect(router.push).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Update Product" })).toBeEnabled()
  })
})

describe("ProductEditorPage characterization — review edit (updateForReview)", () => {
  const rejectedProduct = makeProduct({
    id: "p-1",
    name: "Rejected Product",
    detailedName: "",
    barcode: 4006381333931,
    barcodeFormats: "EAN_13",
    description: "desc",
    manufacturerCode: "MNF-1",
    manufacturer: "MARK3",
    brand: "MARK3",
    exampleVariationsProductId: "",
    manufacturerSiteProductPage: "https://example.com/p",
    dentalLicenseRequired: "Yes",
    coverPhotoPath: "/uploads/existing-cover.png",
    photoPhats: ["/uploads/existing-1.png"],
    height: 2,
    length: undefined,
    width: 0,
    weight: 1,
    categoryLevel1: "Dental Supplies",
    categoryLevel2: "Endodontic products",
    categoryLevel3: "Hand files-reamers-hedstroms",
    categoryLevel4: "K-Files",
  })

  it("loads each record once and PUTs the full DTO in wire order with the existing images as fallback paths", async () => {
    const user = userEvent.setup()
    const counts = { product: 0, listing: 0 }
    server.use(
      http.get("*/api/products/:id/owner", () => {
        counts.product += 1
        return HttpResponse.json(rejectedProduct)
      }),
      http.get("*/api/user-products/:id", () => {
        counts.listing += 1
        return HttpResponse.json(
          makeUserProductDetailResponse({
            id: "up-9",
            active: false,
            skuCode: "SKU-9",
            price: 10,
            stock: 5,
            shipmentFee: 1,
            heavyShippingSurcharge: 0,
            fulfillmentPolicy: "Ships within 3 business days",
          }),
        )
      }),
    )
    const requestJson = spyOnReviewRequests()
    const { router, queryClient } = render(<CreateProductPage />, {
      searchParams: "reviewEditId=p-1&reviewUserProductId=up-9",
    })
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    await waitFor(() => expect(screen.getByLabelText(/Product Name/)).toHaveValue("Rejected Product"))
    await user.click(nextButton())
    await user.click(nextButton())
    await user.click(screen.getByRole("button", { name: "Resubmit for Review" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Product updated and resubmitted for review!"))
    const [request] = reviewRequests(requestJson)
    expect(reviewRequests(requestJson)).toHaveLength(1)
    expect(request?.method).toBe("PUT")
    expect(request?.url).toContain("/api/products/review/p-1")
    const json = JSON.parse(String(request?.data?.get("data")))
    const expected = {
      name: "Rejected Product",
      coverPhotoPath: getFullImageUrl("/uploads/existing-cover.png"),
      photoPhats: [getFullImageUrl("/uploads/existing-1.png")],
      barcode: 4006381333931,
      barcodeFormats: "EAN_13",
      description: "desc",
      manufacturerCode: "MNF-1",
      manufacturer: "MARK3",
      brand: "MARK3",
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Hand files-reamers-hedstroms",
      categoryLevel4: "K-Files",
      manufacturerSiteProductPage: "https://example.com/p",
      dentalLicenseRequired: "Yes",
      height: 2,
      width: 0,
      weight: 1,
      skuCode: "SKU-9",
      price: 10,
      stock: 5,
      // Always true on the review DTO, whatever the loaded listing's flag was.
      active: true,
      shipmentFee: 1,
      heavyShippingSurcharge: 0,
      exportPackaging: false,
      fulfillmentPolicy: "Ships within 3 days",
    }
    expect(json).toEqual(expected)
    expect(Object.keys(json)).toEqual(Object.keys(expected))
    expect(request?.data?.get("coverPhoto")).toBeNull()
    expect(request?.data?.getAll("photos")).toEqual([])
    expectProductsPageCachesInvalidated(invalidate)
    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard/products")
    expect(counts).toEqual({ product: 1, listing: 1 })
  })
})

describe("ProductEditorPage characterization — manual create (createForReview)", () => {
  const fillBasicTab = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
    await user.type(screen.getByLabelText("Price *"), "42")
    await user.type(screen.getByLabelText("Stock *"), "7")
    await user.type(screen.getByLabelText("Shipment Fee *"), "5")
    await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
    await user.selectOptions(screen.getByRole("combobox", { name: "Fulfillment Policy *" }), "Ships within 1 day")
  }

  const fillDetailsTab = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText("Detailed Description *"), "A great dental product")
    await user.type(screen.getByLabelText("Manufacturer Code *"), "MNF-1")
    await user.type(screen.getByLabelText("Manufacturer *"), "MARK3")
    await user.type(screen.getByLabelText("Brand"), "Acme Dental")
    await user.click(screen.getByRole("combobox", { name: "Category 2" }))
    await user.click(await screen.findByRole("option", { name: "Endodontic products" }))
    await user.click(screen.getByRole("combobox", { name: "Category 3" }))
    await user.click(await screen.findByRole("option", { name: "Hand files-reamers-hedstroms" }))
    await user.click(screen.getByRole("combobox", { name: "Category 4" }))
    await user.click(await screen.findByRole("option", { name: "K-Files" }))
    await user.type(screen.getByLabelText("Manufacturer Site Product Page *"), "https://example.com/products/item")
    await user.type(screen.getByLabelText("Weight *"), "1.5")
  }

  it("POSTs the DTO in wire order with files as multipart parts and links as paths", async () => {
    const user = userEvent.setup()
    const requestJson = spyOnReviewRequests()
    const { router, queryClient } = render(<CreateProductPage />)
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await user.click(
      await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
    )
    await fillBasicTab(user)
    await user.type(screen.getByLabelText(/Barcode$/), "4006381333931")
    await user.click(tabButton("Product Details"))
    await fillDetailsTab(user)
    await user.click(screen.getByRole("switch"))
    await user.click(tabButton("Media"))

    // Cover: an uploaded file. Gallery: two uploaded files plus a linked URL.
    await user.upload(
      document.querySelector("#coverPhotoInput") as HTMLInputElement,
      new File(["c"], "cover.png", { type: "image/png" }),
    )
    await user.upload(document.querySelector("#photosInput") as HTMLInputElement, [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ])
    await user.click(screen.getAllByRole("button", { name: /Add via Link/ })[1] as HTMLElement)
    await user.type(screen.getByPlaceholderText("https://example.com/image.jpg"), "https://cdn.example/g.png")
    await user.click(screen.getByRole("button", { name: "Add" }))
    await user.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Product submitted for review!"))
    const requests = reviewRequests(requestJson)
    expect(requests).toHaveLength(1)
    expect(requests[0]?.method).toBe("POST")
    const data = requests[0]?.data as FormData
    const json = JSON.parse(String(data.get("data")))
    const expected = {
      name: "Composite Kit",
      photoPhats: ["https://cdn.example/g.png"],
      barcode: 4006381333931,
      barcodeFormats: "EAN_13",
      description: "A great dental product",
      manufacturerCode: "MNF-1",
      manufacturer: "MARK3",
      brand: "Acme Dental",
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Hand files-reamers-hedstroms",
      categoryLevel4: "K-Files",
      manufacturerSiteProductPage: "https://example.com/products/item",
      dentalLicenseRequired: "Yes",
      weight: 1.5,
      skuCode: "SKU-1",
      price: 42,
      stock: 7,
      active: true,
      shipmentFee: 5,
      heavyShippingSurcharge: 3,
      exportPackaging: false,
      fulfillmentPolicy: "Ships within 1 day",
    }
    expect(json).toEqual(expected)
    expect(Object.keys(json)).toEqual(Object.keys(expected))
    expect((data.get("coverPhoto") as File).name).toBe("cover.png")
    expect((data.getAll("photos") as File[]).map((f) => f.name)).toEqual(["a.png", "b.png"])
    expectProductsPageCachesInvalidated(invalidate)
    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard/products")
  })

  it("clears stale field errors when a submit starts, then shows only the backend's reason", async () => {
    const user = userEvent.setup()
    const original = apiRequest.requestJson.bind(apiRequest)
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) =>
      String((config as { url?: string }).url).includes("/api/products/review")
        ? (Promise.reject(new Error("Barcode already registered")) as never)
        : (original(config as never) as never),
    )
    render(<CreateProductPage />)

    await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
    await user.click(
      await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
    )
    await fillBasicTab(user)
    await user.click(tabButton("Product Details"))
    await fillDetailsTab(user)
    await user.click(tabButton("Media"))
    await user.click(screen.getByRole("button", { name: "Submit" }))
    expect(await screen.findByText("Cover photo is required")).toBeInTheDocument()

    await user.upload(
      document.querySelector("#coverPhotoInput") as HTMLInputElement,
      new File(["c"], "cover.png", { type: "image/png" }),
    )
    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("Barcode already registered")).toBeInTheDocument()
    expect(screen.queryByText("Cover photo is required")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Media$/ })).toBeInTheDocument()
  })
})
