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

  // A11y: `ProductListingHeader`'s `<h1>Dental Products</h1>` used to be
  // followed directly by the filter panel's `<h3>` section titles (mobile
  // filters render before it, the desktop sidebar right after it - both are
  // in the DOM at once, see infra note #18), an h1 -> h3 level skip. The
  // filter headings were promoted to h2 so no forward jump exceeds 1, no
  // matter how mobile/desktop duplication interleaves them.
  it("has exactly one h1 and no forward heading-level skip", () => {
    renderListing()

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Dental Products")

    const levels = screen
      .getAllByRole("heading")
      .map((el) => Number(el.tagName[1]))
      .filter((level) => !Number.isNaN(level))
    let previousLevel: number | undefined
    for (const level of levels) {
      if (previousLevel !== undefined) {
        expect(level - previousLevel).toBeLessThanOrEqual(1)
      }
      previousLevel = level
    }
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

    await user.click(screen.getAllByRole("radio", { name: "Price: Low to High" })[0])

    const [url] = router.push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])
    expect(params.get("sort")).toBe("price-asc")
    expect(params.get("page")).toBe("1")
    expect(params.getAll("brands")).toEqual(["MARK3"])
  })

  it("picking Best Match removes the sort parameter instead of spelling it out", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { router } = renderListing({ sort: "price-asc" }, "sort=price-asc")

    await user.click(screen.getAllByRole("radio", { name: "Best Match" })[0])

    const [url] = router.push.mock.calls[0] as [string]
    expect(new URLSearchParams(url.split("?")[1]).has("sort")).toBe(false)
  })

  it("changing the page size resets to page 1", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { router } = renderListing({}, "page=4&size=20")

    await user.click(screen.getByRole("combobox", { name: "Items per page" }))
    await user.click(await screen.findByRole("option", { name: "30" }))

    const [url] = router.push.mock.calls[0] as [string]
    const params = new URLSearchParams(url.split("?")[1])
    expect(params.get("size")).toBe("30")
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

    // Known a11y bug, fix tracked separately (frontend-only, not a backend dependency): on the
    // first/last page the prev/next affordance should stay in the accessibility tree as a
    // disabled control, not vanish as a plain <span>.
    it.todo("renders a disabled (not absent) previous/next control on the first/last page")
  })
})
