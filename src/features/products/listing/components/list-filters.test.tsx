import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AttributeGroup, CompanyOption, FilterOption, VendorOption } from "@/lib/api/public-products"
import { lastPushedParams, renderWithFilterNavigation } from "@/test/harness/filter-navigation-harness"
import { screen } from "@/test/render"
import AttributeFilter from "./AttributeFilter"
import BrandFilter from "./BrandFilter"
import CategoryFilter from "./CategoryFilter"
import CompanyFilter from "./CompanyFilter"
import ManufacturerFilter from "./ManufacturerFilter"
import VendorFilter from "./VendorFilter"

/** The list filters share one template: 8 visible rows, a search box past 8 options, a show-more toggle. */
const manyBrands: FilterOption[] = Array.from({ length: 11 }, (_, index) => ({
  name: `Brand ${index + 1}`,
  count: index + 1,
}))

describe("BrandFilter (shared list-filter template)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("hides the search box while the list is short enough to read at a glance", () => {
    renderWithFilterNavigation(<BrandFilter brands={[{ name: "MARK3", count: 4 }]} />)

    expect(screen.queryByPlaceholderText("Search brands...")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Show \d+ more/ })).not.toBeInTheDocument()
  })

  it("shows only the first eight options and reveals the rest on demand", async () => {
    const user = userEvent.setup()
    renderWithFilterNavigation(<BrandFilter brands={manyBrands} />)

    expect(screen.getByLabelText("Brand 8")).toBeInTheDocument()
    expect(screen.queryByLabelText("Brand 9")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show 3 more brands" }))
    expect(screen.getByLabelText("Brand 11")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show less" }))
    expect(screen.queryByLabelText("Brand 11")).not.toBeInTheDocument()
  })

  it("narrows the list case-insensitively as the shopper types", async () => {
    const user = userEvent.setup()
    renderWithFilterNavigation(<BrandFilter brands={[...manyBrands, { name: "Kerr", count: 2 }]} />)

    await user.type(screen.getByPlaceholderText("Search brands..."), "kerr")

    expect(screen.getByLabelText("Kerr")).toBeInTheDocument()
    expect(screen.queryByLabelText("Brand 1")).not.toBeInTheDocument()
  })

  it("says so when the search matches nothing", async () => {
    const user = userEvent.setup()
    renderWithFilterNavigation(<BrandFilter brands={manyBrands} />)

    await user.type(screen.getByPlaceholderText("Search brands..."), "zzz")

    expect(screen.getByText("No brands found")).toBeInTheDocument()
  })

  it("shows each option's product count next to it", () => {
    renderWithFilterNavigation(<BrandFilter brands={[{ name: "MARK3", count: 24 }]} />)

    expect(screen.getByText("24")).toBeInTheDocument()
  })

  it("clears every brand at once from the section header", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<BrandFilter brands={manyBrands} />, "brands=Brand+1&brands=Brand+2")

    await user.click(screen.getByRole("button", { name: "Clear" }))

    expect(lastPushedParams(router).getAll("brands")).toEqual([])
  })
})

describe("ManufacturerFilter", () => {
  it("writes the picked manufacturer to the URL", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(
      <ManufacturerFilter manufacturers={[{ name: "Dentsply", count: 3 }]} />,
    )

    await user.click(screen.getByLabelText("Dentsply"))

    expect(lastPushedParams(router).getAll("manufacturers")).toEqual(["Dentsply"])
  })
})

describe("VendorFilter", () => {
  const vendors: VendorOption[] = [
    { id: "vendor-1", name: "Acme Dental", count: 12 },
    { id: "vendor-2", name: "Beta Supplies", count: 3 },
  ]

  it("shows vendor names but writes vendor ids to the URL", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<VendorFilter vendors={vendors} />)

    await user.click(screen.getByLabelText("Acme Dental"))

    expect(lastPushedParams(router).getAll("vendors")).toEqual(["vendor-1"])
  })

  it("keeps vendor selections additive", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<VendorFilter vendors={vendors} />, "vendors=vendor-1")

    await user.click(screen.getByLabelText("Beta Supplies"))

    expect(lastPushedParams(router).getAll("vendors")).toEqual(["vendor-1", "vendor-2"])
  })
})

describe("CompanyFilter", () => {
  const companies: CompanyOption[] = [
    { id: "company-1", name: "Northwind Dental", count: 8 },
    { id: "company-2", name: "Southgate Labs", count: 2 },
  ]

  it("renders nothing when the backend returned no companies", () => {
    renderWithFilterNavigation(<CompanyFilter companies={[]} />)

    expect(screen.queryByRole("heading", { name: "Vendor" })).not.toBeInTheDocument()
  })

  it("is single-select — picking another company replaces the current one", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<CompanyFilter companies={companies} />, "companyId=company-1")

    expect(screen.getByLabelText("Northwind Dental")).toBeChecked()
    await user.click(screen.getByLabelText("Southgate Labs"))

    expect(lastPushedParams(router).get("companyId")).toBe("company-2")
  })

  it("re-clicking the active company clears the scope", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<CompanyFilter companies={companies} />, "companyId=company-1")

    await user.click(screen.getByLabelText("Northwind Dental"))

    expect(lastPushedParams(router).has("companyId")).toBe(false)
  })
})

describe("AttributeFilter", () => {
  const group: AttributeGroup = {
    attributeName: "shade_guide",
    values: [
      { value: "A1", count: 5 },
      { value: "A2", count: 2 },
    ],
  }

  it("title-cases the attribute name for its heading", () => {
    renderWithFilterNavigation(<AttributeFilter group={group} />)

    expect(screen.getByRole("heading", { name: "Shade Guide", level: 3 })).toBeInTheDocument()
  })

  it("clears only its own group and leaves other attributes alone", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(
      <AttributeFilter group={group} />,
      "attributes=shade_guide%3AA1&attributes=size%3ASmall",
    )

    await user.click(screen.getByRole("button", { name: "Clear" }))

    expect(lastPushedParams(router).getAll("attributes")).toEqual(["size:Small"])
  })
})

describe("CategoryFilter", () => {
  const categories: FilterOption[] = [
    { name: "Consumables > Impression > Trays", count: 12 },
    { name: "Consumables > Impression > Tips", count: 4 },
    { name: "Equipment", count: 7 },
  ]

  it("renders nothing without categories", () => {
    renderWithFilterNavigation(<CategoryFilter categories={[]} />)

    expect(screen.queryByRole("heading", { name: "Category" })).not.toBeInTheDocument()
  })

  it("nests the '>'-separated path into an expandable tree", async () => {
    const user = userEvent.setup()
    renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    expect(screen.getByLabelText("Trays")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Consumables/ }))
    expect(screen.queryByLabelText("Trays")).not.toBeInTheDocument()
  })

  it("sends the full path of a leaf, not just its label", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    await user.click(screen.getByLabelText("Tips"))

    expect(lastPushedParams(router).getAll("categories")).toEqual(["Consumables > Impression > Tips"])
  })

  it("offers a top-level category with no children as a plain checkbox", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    await user.click(screen.getByLabelText("Equipment"))

    expect(lastPushedParams(router).getAll("categories")).toEqual(["Equipment"])
  })
})
