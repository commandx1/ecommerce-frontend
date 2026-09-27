import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BarcodeLookupProduct, BarcodeProduct, NormalizedSearchProduct, Product } from "@/lib/api/products"
import { apiRequest } from "@/lib/api/request"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct } from "@/test/factories"
import { fireEvent, render, screen, waitFor } from "@/test/render"
import ProductDetailsModal from "./ProductDetailsModal"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

// The storefront category-counts purge (a Server Action); resolves by default.
const revalidateCategoryCountsSpy = vi.hoisted(() => vi.fn())
vi.mock("@/lib/actions/revalidate-category-counts", () => ({
  revalidateCategoryCounts: revalidateCategoryCountsSpy,
}))

const onClose = vi.fn()
const onSuccess = vi.fn()

const localProduct = (overrides: Partial<Product> = {}): NormalizedSearchProduct => {
  const product = makeProduct(overrides)
  return {
    id: product.id,
    barcode: String(product.barcode),
    title: product.name,
    brand: product.brand,
    category: undefined,
    images: product.coverPhotoPath ? [product.coverPhotoPath] : [],
    source: "local",
    originalData: product,
  }
}

const barcodeLookupProduct = (overrides: Partial<BarcodeLookupProduct> = {}): NormalizedSearchProduct => {
  const data: BarcodeLookupProduct = {
    barcode_number: "1234567890123",
    barcode_formats: "EAN_13",
    mpn: "MPN-1",
    model: "Model X",
    asin: "ASIN-1",
    title: "Barcode Lookup Product",
    category: "Dental > Composite",
    manufacturer: "MARK3",
    brand: "MARK3",
    contributors: ["Alice", "Bob"],
    age_group: "Adult",
    ingredients: "Resin",
    nutrition_facts: undefined,
    energy_efficiency_class: "A",
    color: "White",
    gender: "Unisex",
    material: "Composite",
    pattern: "Solid",
    format: "Kit",
    multipack: "1",
    size: "Medium",
    length: "10",
    width: "5",
    height: "3",
    weight: "1.2",
    release_date: "2024-01-01",
    description: "A great lookup product.",
    features: ["Fast cure", "Low shrinkage"],
    images: ["https://cdn.example/a.png", "https://cdn.example/b.png"],
    ...overrides,
  }
  return {
    id: data.barcode_number,
    barcode: data.barcode_number,
    title: data.title || "",
    brand: data.brand,
    category: data.category,
    images: data.images || [],
    source: "barcode_lookup",
    originalData: data,
  }
}

const barcodeSavedProduct = (overrides: Partial<BarcodeProduct> = {}): NormalizedSearchProduct => {
  const data: BarcodeProduct = {
    id: 7,
    barcodeNumber: "9998887776665",
    barcodeFormats: "UPC_A",
    mpn: "MPN-7",
    title: "Saved Barcode Product",
    category: "Dental",
    manufacturer: "Acme",
    brand: "Acme",
    images: ["https://cdn.example/c.png"],
    ...overrides,
  }
  return {
    id: String(data.id),
    barcode: data.barcodeNumber,
    title: data.title || "",
    brand: data.brand,
    category: data.category,
    images: data.images || [],
    source: "barcode_lookup",
    originalData: data,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  onClose.mockClear()
  onSuccess.mockClear()
  revalidateCategoryCountsSpy.mockReset().mockResolvedValue(undefined)
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("ProductDetailsModal — rendering specs for each product source", () => {
  it("renders a local catalogue product's specs, dimensions, and attributes", () => {
    const product = localProduct({
      brand: "MARK3",
      manufacturer: "MARK3 Inc.",
      manufacturerCode: "MNF-1",
      categoryLevel1: "Restorative",
      categoryLevel2: "Composite",
      packaging: "Box",
      primaryMarket: "US",
      scent: "Mint",
      size: "Large",
      type: "Kit",
      sds: "SDS-1",
      dentalLicenseRequired: "Yes",
      height: 5,
      length: 10,
      width: 7,
      weight: 2,
      distanceUnit: "cm",
      massUnit: "kg",
      manufacturerSiteProductPage: "https://example.com/p",
      detailedName: "Different Detailed Name",
      attributes: [{ attributeName: "Color", attributeValue: "Blue" }],
    })

    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.getByText("Restorative / Composite")).toBeInTheDocument()
    expect(screen.getByText("L 10cm · W 7cm · H 5cm · 2 kg")).toBeInTheDocument()
    expect(screen.getByText("Yes")).toBeInTheDocument()
    expect(screen.getByText("Different Detailed Name")).toBeInTheDocument()
    expect(screen.getByText("https://example.com/p")).toBeInTheDocument()
    expect(screen.getByText("Color")).toBeInTheDocument()
    expect(screen.getByText("Blue")).toBeInTheDocument()
  })

  it("falls back to the sub-category id when no category levels are set", () => {
    const product = localProduct({
      categoryLevel1: undefined,
      categoryLevel2: undefined,
      categoryLevel3: undefined,
      categoryLevel4: undefined,
      categoryLevel5: undefined,
      subCategoriesId: "sub-42",
    })

    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.getByText("sub-42")).toBeInTheDocument()
  })

  it("renders a barcode-lookup product's full spec set and description", () => {
    const product = barcodeLookupProduct()

    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.getAllByText("Barcode Lookup Product").length).toBeGreaterThan(0)
    expect(screen.getByText("A great lookup product.")).toBeInTheDocument()
    expect(screen.getByText("Model X")).toBeInTheDocument()
    expect(screen.getByText("L 10 · W 5 · H 3 · 1.2 kg")).toBeInTheDocument()
    expect(screen.getByText("Alice, Bob")).toBeInTheDocument()
    expect(screen.getByText("Fast cure, Low shrinkage")).toBeInTheDocument()
  })

  it("renders a saved barcode product's minimal spec set", () => {
    const product = barcodeSavedProduct()

    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.getAllByText("Saved Barcode Product").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Acme").length).toBeGreaterThan(0)
    expect(screen.getByText("UPC_A")).toBeInTheDocument()
  })

  it("shows a placeholder icon when the product has no images", () => {
    const product = localProduct({ coverPhotoPath: undefined })

    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("switches to the second thumbnail on click", async () => {
    const user = userEvent.setup()
    const product = barcodeLookupProduct({ images: ["https://cdn.example/a.png", "https://cdn.example/b.png"] })

    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    const mainImage = document.querySelector(".w-70.h-70 img") as HTMLImageElement
    expect(mainImage.src).toContain("a.png")

    const thumbnails = screen.getAllByRole("button").filter((btn) => btn.querySelector("img"))
    await user.click(thumbnails[1] as HTMLElement)

    expect((document.querySelector(".w-70.h-70 img") as HTMLImageElement).src).toContain("b.png")
  })

  it("falls back to a placeholder icon once every image has failed to load", async () => {
    const product = barcodeLookupProduct({ images: ["https://cdn.example/a.png", "https://cdn.example/b.png"] })

    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    const mainImageBefore = document.querySelector(".w-70.h-70 img") as HTMLImageElement
    fireEvent.error(mainImageBefore)

    // The second image takes over as the main image after the first breaks.
    const mainImageAfter = await waitFor(() => document.querySelector(".w-70.h-70 img") as HTMLImageElement)
    expect(mainImageAfter.src).toContain("b.png")
    fireEvent.error(mainImageAfter)

    // Both images are now broken, so the gallery collapses to the generic placeholder icon.
    await waitFor(() => expect(screen.queryByRole("img")).not.toBeInTheDocument())
  })
})

describe("ProductDetailsModal — price/stock validation", () => {
  it("requires a positive price", async () => {
    const user = userEvent.setup()
    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText("Stock *"), "5")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    expect(await screen.findByText("Price must be a positive number")).toBeInTheDocument()
  })

  it("rejects a zero price", async () => {
    const user = userEvent.setup()
    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText("Price *"), "0")
    await user.type(screen.getByLabelText("Stock *"), "5")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    expect(await screen.findByText("Price must be a positive number")).toBeInTheDocument()
  })

  it("requires a non-negative stock", async () => {
    const user = userEvent.setup()
    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText("Price *"), "10")
    await user.type(screen.getByLabelText("Stock *"), "-1")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    expect(await screen.findByText("Stock must be a non-negative number")).toBeInTheDocument()
  })

  it("accepts a zero stock", async () => {
    const user = userEvent.setup()
    let payload: Record<string, unknown> | null = null
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) => {
      payload = (config as { data?: Record<string, unknown> }).data ?? null
      return Promise.resolve({ id: "up-1" }) as never
    })

    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText("Price *"), "10")
    await user.type(screen.getByLabelText("Stock *"), "0")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(payload).toMatchObject({ stock: 0, price: 10 })
  })

  it("disables Add Product when the product has no title", () => {
    const product = localProduct({ name: "" })
    // Force an empty title on the normalized item (buildDetailSections reads it separately).
    const emptyTitled: NormalizedSearchProduct = { ...product, title: "   " }

    render(<ProductDetailsModal product={emptyTitled} isOpen onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.getByRole("button", { name: "Add Product" })).toBeDisabled()
  })

  it("resets price, stock, and any error when the modal reopens for a new product", () => {
    const product = localProduct()
    const { rerender } = render(
      <ProductDetailsModal product={product} isOpen={false} onClose={onClose} onSuccess={onSuccess} />,
    )

    rerender(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.getByLabelText("Price *")).toHaveValue(null)
    expect(screen.getByLabelText("Stock *")).toHaveValue(null)
  })
})

describe("ProductDetailsModal — submitting a local catalogue product", () => {
  it("creates a user-product listing with the entered price and stock", async () => {
    const user = userEvent.setup()
    let payload: Record<string, unknown> | null = null
    vi.spyOn(apiRequest, "requestJson").mockImplementation((config) => {
      payload = (config as { data?: Record<string, unknown> }).data ?? null
      return Promise.resolve({ id: "up-1" }) as never
    })

    const product = localProduct({ id: "p-42" })
    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText("Price *"), "19.99")
    await user.type(screen.getByLabelText("Stock *"), "3")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Product added successfully!"))
    expect(payload).toMatchObject({ productId: "p-42", price: 19.99, discount: 0, stock: 3, active: true })
    expect(onSuccess).toHaveBeenCalled()
    // The new listing is live, so the storefront's cached category counts are purged.
    expect(revalidateCategoryCountsSpy).toHaveBeenCalledTimes(1)
  })

  it("completes the add without waiting for the category-counts purge", async () => {
    const user = userEvent.setup()
    vi.spyOn(apiRequest, "requestJson").mockResolvedValue({ id: "up-1" } as never)
    revalidateCategoryCountsSpy.mockReturnValue(new Promise<void>(() => {}))

    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText("Price *"), "10")
    await user.type(screen.getByLabelText("Stock *"), "1")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(screen.getByRole("button", { name: "Add Product" })).toBeEnabled()
  })

  it("surfaces the backend error message and does not call onSuccess", async () => {
    const user = userEvent.setup()
    vi.spyOn(apiRequest, "requestJson").mockRejectedValue(new Error("Duplicate listing"))

    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText("Price *"), "10")
    await user.type(screen.getByLabelText("Stock *"), "1")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    expect(await screen.findByText("Duplicate listing")).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(revalidateCategoryCountsSpy).not.toHaveBeenCalled()
  })

  it("falls back to a generic error message when the failure has none", async () => {
    const user = userEvent.setup()
    vi.spyOn(apiRequest, "requestJson").mockRejectedValue(new Error())

    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText("Price *"), "10")
    await user.type(screen.getByLabelText("Stock *"), "1")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    expect(await screen.findByText("Failed to add product. Please try again.")).toBeInTheDocument()
  })

  it("shows a loading state on the submit button while the request is in flight", async () => {
    const user = userEvent.setup()
    let resolveRequest: (() => void) | undefined
    vi.spyOn(apiRequest, "requestJson").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = () => resolve({ id: "up-1" } as never)
        }) as never,
    )

    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText("Price *"), "10")
    await user.type(screen.getByLabelText("Stock *"), "1")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    expect(screen.getByRole("button", { name: /Adding/ })).toBeDisabled()
    resolveRequest?.()
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })
})

describe("ProductDetailsModal — submitting a barcode-sourced product", () => {
  it("submits a full barcode-lookup product for review with derived attributes", async () => {
    const user = userEvent.setup()
    const requestJsonOriginal = apiRequest.requestJson.bind(apiRequest)
    const requestJson = vi
      .spyOn(apiRequest, "requestJson")
      .mockImplementation((config) =>
        String((config as { url?: string }).url).includes("/api/products/review")
          ? (Promise.resolve(makeProduct()) as never)
          : (requestJsonOriginal(config as never) as never),
      )

    const product = barcodeLookupProduct()
    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText("Price *"), "25")
    await user.type(screen.getByLabelText("Stock *"), "4")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const call = requestJson.mock.calls.find(([c]) =>
      String((c as { url?: string }).url).includes("/api/products/review"),
    )
    const data = (call?.[0] as { data: FormData }).data
    const json = JSON.parse(String(data.get("data"))) as Record<string, unknown>
    expect(json).toMatchObject({
      name: "Barcode Lookup Product",
      barcode: 1234567890123,
      manufacturer: "MARK3",
      brand: "MARK3",
      price: 25,
      stock: 4,
    })
    expect(json.attributes).toEqual(expect.arrayContaining([{ attributeName: "Model", attributeValue: "Model X" }]))
  })

  it("submits a saved barcode product without the lookup-only attributes", async () => {
    const user = userEvent.setup()
    const requestJsonOriginal = apiRequest.requestJson.bind(apiRequest)
    const requestJson = vi
      .spyOn(apiRequest, "requestJson")
      .mockImplementation((config) =>
        String((config as { url?: string }).url).includes("/api/products/review")
          ? (Promise.resolve(makeProduct()) as never)
          : (requestJsonOriginal(config as never) as never),
      )

    const product = barcodeSavedProduct()
    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText("Price *"), "8")
    await user.type(screen.getByLabelText("Stock *"), "2")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const call = requestJson.mock.calls.find(([c]) =>
      String((c as { url?: string }).url).includes("/api/products/review"),
    )
    const data = (call?.[0] as { data: FormData }).data
    const json = JSON.parse(String(data.get("data"))) as Record<string, unknown>
    expect(json).toMatchObject({ name: "Saved Barcode Product", barcode: 9998887776665, price: 8, stock: 2 })
    expect(json.attributes).toBeUndefined()
  })

  it("omits the barcode when the lookup value isn't numeric", async () => {
    const user = userEvent.setup()
    const requestJsonOriginal = apiRequest.requestJson.bind(apiRequest)
    const requestJson = vi
      .spyOn(apiRequest, "requestJson")
      .mockImplementation((config) =>
        String((config as { url?: string }).url).includes("/api/products/review")
          ? (Promise.resolve(makeProduct()) as never)
          : (requestJsonOriginal(config as never) as never),
      )

    const product = barcodeLookupProduct({ barcode_number: "not-a-number" })
    render(<ProductDetailsModal product={product} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText("Price *"), "5")
    await user.type(screen.getByLabelText("Stock *"), "1")
    await user.click(screen.getByRole("button", { name: "Add Product" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    const call = requestJson.mock.calls.find(([c]) =>
      String((c as { url?: string }).url).includes("/api/products/review"),
    )
    const data = (call?.[0] as { data: FormData }).data
    const json = JSON.parse(String(data.get("data"))) as Record<string, unknown>
    expect(json).not.toHaveProperty("barcode")
  })
})

describe("ProductDetailsModal — closing", () => {
  it("calls onClose from the Cancel button", async () => {
    const user = userEvent.setup()
    render(<ProductDetailsModal product={localProduct()} isOpen onClose={onClose} onSuccess={onSuccess} />)

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onClose).toHaveBeenCalled()
  })
})
