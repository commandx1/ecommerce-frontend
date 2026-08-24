import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, within } from "@/test/render"
import ProductListingClient, { type APIProduct } from "./ProductListingClient"

installRadixPointerPolyfills()

const makeApiProduct = (overrides: Partial<APIProduct> = {}): APIProduct => ({
  productId: "p-1",
  productName: "Intra Oral Mixing Tips",
  brand: "MARK3",
  barcode: "123456789012",
  coverPhotoPath: "/uploads/tips.png",
  manufacturerCode: "M-1",
  reorderId: "R-1",
  referanceNumber: "REF-1",
  overallStar: 4.5,
  reviewCount: 12,
  vendorsCount: 3,
  bestPriceVendor: "Acme Dental",
  price: 56,
  oldPrice: 70,
  discount: 20,
  stock: 40,
  ...overrides,
})

type ClientProps = Parameters<typeof ProductListingClient>[0]

const renderListing = (overrides: Partial<ClientProps> = {}, searchParams = "") => {
  const props: ClientProps = {
    initialProducts: [makeApiProduct()],
    totalElements: 1,
    brands: [{ name: "MARK3", count: 24 }],
    manufacturers: [{ name: "Dentsply", count: 4 }],
    categories: [{ name: "Consumables", count: 45 }],
    vendors: [{ id: "vendor-1", name: "Acme Dental", count: 12 }],
    attributeGroups: [],
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    sort: "best-match",
    selectedBrands: [],
    selectedManufacturers: [],
    selectedCategories: [],
    selectedVendors: [],
    minPrice: null,
    maxPrice: null,
    minRating: null,
    inStock: true,
    selectedAttributes: [],
    companyId: null,
    ...overrides,
  }
  return render(<ProductListingClient {...props} />, { route: "/products", searchParams })
}

describe("ProductListingClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("reports the result count and renders a card per product", () => {
    renderListing({
      totalElements: 2,
      initialProducts: [makeApiProduct(), makeApiProduct({ productId: "p-2", productName: "Curing Light" })],
    })

    expect(screen.getByRole("heading", { name: "2 Products Found" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Intra Oral Mixing Tips" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Curing Light" })).toBeInTheDocument()
  })

  it("renders no product cards for an empty result set", () => {
    renderListing({ initialProducts: [], totalElements: 0 })

    expect(screen.getByRole("heading", { name: "0 Products Found" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add to Cart" })).not.toBeInTheDocument()
  })

  it("changing the sort resets to page 1 and keeps the other filters", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { router } = renderListing({}, "page=3&brands=MARK3")

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Price: Low to High" }))

    const [url] = router.push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])
    expect(params.get("sort")).toBe("price-asc")
    expect(params.get("page")).toBe("1")
    expect(params.getAll("brands")).toEqual(["MARK3"])
  })

  it("picking Best Match removes the sort parameter instead of spelling it out", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { router } = renderListing({ sort: "price-asc" }, "sort=price-asc")

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Best Match" }))

    const [url] = router.push.mock.calls[0] as [string]
    expect(new URLSearchParams(url.split("?")[1]).has("sort")).toBe(false)
  })

  it("changing the page size resets to page 1", async () => {
    const user = userEvent.setup()
    const { router } = renderListing({}, "page=4&size=20")

    await user.click(screen.getByRole("button", { name: "50" }))

    const [url] = router.push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])
    expect(params.get("size")).toBe("50")
    expect(params.get("page")).toBe("1")
  })

  describe("pagination", () => {
    it("describes the visible slice of the result set", () => {
      renderListing({ currentPage: 2, pageSize: 20, totalElements: 45, totalPages: 3 })

      const bar = screen.getByText("21-40").closest("div")!
      expect(within(bar).getByText("45")).toBeInTheDocument()
    })

    it("caps the upper bound at the total on the last page", () => {
      renderListing({ currentPage: 3, pageSize: 20, totalElements: 45, totalPages: 3 })

      expect(screen.getByText("41-45")).toBeInTheDocument()
    })

    it("builds page links that carry the active filters and sort", () => {
      renderListing({
        currentPage: 1,
        pageSize: 20,
        totalElements: 60,
        totalPages: 3,
        sort: "price-asc",
        selectedBrands: ["MARK3"],
        minPrice: 10,
        inStock: false,
      })

      const link = screen.getByRole("link", { name: "2" })
      const params = new URLSearchParams(link.getAttribute("href")!.split("?")[1])
      expect(params.get("page")).toBe("2")
      expect(params.get("size")).toBe("20")
      expect(params.get("sort")).toBe("price-asc")
      expect(params.getAll("brands")).toEqual(["MARK3"])
      expect(params.get("minPrice")).toBe("10")
      expect(params.get("inStock")).toBe("false")
    })

    // FIX (TEST-FINDINGS K7): `companyId` must survive pagination/page-size links, otherwise a
    // company-scoped visitor silently falls back to the full catalog after the first click.
    it("keeps companyId in page links", () => {
      renderListing({ currentPage: 1, totalElements: 60, totalPages: 3, companyId: "company-9" }, "companyId=company-9")

      const link = screen.getByRole("link", { name: "2" })
      expect(new URLSearchParams(link.getAttribute("href")!.split("?")[1]).get("companyId")).toBe("company-9")
    })

    // BULGU: on the first/last page the prev/next affordance becomes a plain <span> with no role,
    // so keyboard and screen-reader users get no "disabled" control at all — it simply vanishes
    // from the accessibility tree (TEST-FINDINGS already records the href-less <a> variant).
    it("renders the edge prev/next affordances as unreachable spans (current behaviour)", () => {
      renderListing({ currentPage: 1, totalElements: 40, totalPages: 2 })

      const bar = screen.getByText("1-20").closest("div")!
      // page 1, page 2 and "next" — but no "previous" control exists in the a11y tree.
      expect(within(bar).getAllByRole("link")).toHaveLength(3)
    })
  })
})
