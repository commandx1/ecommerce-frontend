import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AttributeGroup, FilterOption, VendorOption } from "@/lib/api/public-products"
import { lastPushedParams, renderWithFilterNavigation } from "@/test/harness/filter-navigation-harness"
import { screen } from "@/test/render"
import ProductFiltersPanel from "./ProductFiltersPanel"

const brands: FilterOption[] = [
  { name: "MARK3", count: 24 },
  { name: "Kerr", count: 9 },
]
const manufacturers: FilterOption[] = [{ name: "Dentsply", count: 4 }]
const categories: FilterOption[] = [{ name: "Consumables", count: 45 }]
const vendors: VendorOption[] = [
  { id: "vendor-1", name: "Acme Dental", count: 12 },
  { id: "vendor-2", name: "Beta Supplies", count: 3 },
]
const attributeGroups: AttributeGroup[] = [
  {
    attributeName: "shade_guide",
    values: [
      { value: "A1", count: 5 },
      { value: "A2", count: 2 },
    ],
  },
]

const renderPanel = (searchParams = "") =>
  renderWithFilterNavigation(
    <ProductFiltersPanel
      brands={brands}
      manufacturers={manufacturers}
      categories={categories}
      vendors={vendors}
      attributeGroups={attributeGroups}
    />,
    searchParams,
  )

describe("ProductFiltersPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders one section per filter family, including dynamic attribute groups", () => {
    renderPanel()

    for (const heading of ["Category", "Brand", "Manufacturer", "Price Range", "Availability", "Customer Rating"]) {
      expect(screen.getByRole("heading", { name: heading, level: 3 })).toBeInTheDocument()
    }
    // `shade_guide` is title-cased for display.
    expect(screen.getByRole("heading", { name: "Shade Guide", level: 3 })).toBeInTheDocument()
  })

  it("ticking a brand pushes a /products URL carrying that brand and resets the page", async () => {
    const user = userEvent.setup()
    const { router } = renderPanel("page=4&size=24")

    await user.click(screen.getByLabelText("MARK3"))

    const [url] = router.push.mock.calls[0] as [string, { scroll: boolean }]
    expect(url.startsWith("/products?")).toBe(true)
    expect(router.push.mock.calls[0][1]).toEqual({ scroll: false })
    const params = lastPushedParams(router)
    expect(params.getAll("brands")).toEqual(["MARK3"])
    expect(params.get("page")).toBe("1")
    expect(params.get("size")).toBe("24")
  })

  it("adds a second brand instead of replacing the first", async () => {
    const user = userEvent.setup()
    const { router } = renderPanel("brands=MARK3")

    await user.click(screen.getByLabelText("Kerr"))

    expect(lastPushedParams(router).getAll("brands")).toEqual(["MARK3", "Kerr"])
  })

  it("unticking an active brand drops it from the URL", async () => {
    const user = userEvent.setup()
    const { router } = renderPanel("brands=MARK3&brands=Kerr")

    expect(screen.getByLabelText("MARK3")).toBeChecked()
    await user.click(screen.getByLabelText("MARK3"))

    expect(lastPushedParams(router).getAll("brands")).toEqual(["Kerr"])
  })

  it("encodes an attribute selection as name:value", async () => {
    const user = userEvent.setup()
    const { router } = renderPanel()

    await user.click(screen.getByLabelText("A2"))

    expect(lastPushedParams(router).getAll("attributes")).toEqual(["shade_guide:A2"])
  })

  it("keeps sort and size while changing a filter", async () => {
    const user = userEvent.setup()
    const { router } = renderPanel("sort=price-asc&size=48&minRating=4")

    await user.click(screen.getByLabelText("Consumables"))

    const params = lastPushedParams(router)
    expect(params.get("sort")).toBe("price-asc")
    expect(params.get("size")).toBe("48")
    expect(params.get("minRating")).toBe("4")
  })

  describe("active filter chips", () => {
    it("stays hidden while no filter is applied", () => {
      renderPanel()

      expect(screen.queryByRole("heading", { name: "Active Filters" })).not.toBeInTheDocument()
    })

    it("names the vendor behind an id and removes it from the chip", async () => {
      const user = userEvent.setup()
      const { router } = renderPanel("vendors=vendor-1&vendors=vendor-2")

      expect(screen.getByRole("heading", { name: "Active Filters" })).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Remove Acme Dental filter" }))

      expect(lastPushedParams(router).getAll("vendors")).toEqual(["vendor-2"])
    })

    it("falls back to the raw id for a vendor missing from the options", () => {
      renderPanel("vendors=vendor-unknown")

      expect(screen.getByRole("button", { name: "Remove vendor-unknown filter" })).toBeInTheDocument()
    })

    it("formats a price chip as currency and shows Any for an open upper bound", () => {
      renderPanel("minPrice=50")

      expect(screen.getByText("$50.00 – Any")).toBeInTheDocument()
    })

    it("clears both price bounds from the price chip", async () => {
      const user = userEvent.setup()
      const { router } = renderPanel("minPrice=50&maxPrice=200")

      await user.click(screen.getByRole("button", { name: "Remove $50.00 – $200.00 filter" }))

      const params = lastPushedParams(router)
      expect(params.has("minPrice")).toBe(false)
      expect(params.has("maxPrice")).toBe(false)
    })

    it("shows an out-of-stock chip only while the in-stock filter is off", async () => {
      const user = userEvent.setup()
      const { router } = renderPanel("inStock=false")

      await user.click(screen.getByRole("button", { name: "Remove Out of stock included filter" }))

      expect(lastPushedParams(router).has("inStock")).toBe(false)
    })

    it("clear all drops every filter in one navigation", async () => {
      const user = userEvent.setup()
      const { router } = renderPanel(
        "brands=MARK3&categories=Consumables&vendors=vendor-1&minPrice=10&maxPrice=90&minRating=4&inStock=false&attributes=shade_guide%3AA1",
      )

      await user.click(screen.getByRole("button", { name: "Clear all" }))

      const params = lastPushedParams(router)
      expect(Array.from(params.keys())).toEqual(["page"])
      expect(params.get("page")).toBe("1")
    })

    // BULGU (TEST-FINDINGS K7): `companyId` survives "clear all" nowhere else — the chip list never
    // renders one, so a company-scoped visitor cannot see or remove that scope.
    it("never renders a chip for an active companyId", () => {
      renderPanel("companyId=company-9")

      expect(screen.queryByRole("heading", { name: "Active Filters" })).not.toBeInTheDocument()
    })
  })
})
