import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AttributeGroup, FilterOption, VendorOption } from "@/lib/api/public-products"
import { lastPushedParams, renderWithFilterNavigation } from "@/test/harness/filter-navigation-harness"
import { screen } from "@/test/render"
import AttributeFilter from "./AttributeFilter"
import BrandFilter from "./BrandFilter"
import CategoryFilter from "./CategoryFilter"
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

    expect(screen.getByRole("heading", { name: "Shade Guide", level: 2 })).toBeInTheDocument()
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
    { name: "Endodontic products > Endodontic sealers & cements", count: 2 },
    { name: "Endodontic products > Endodontic accessories > Endo organizers & accessories", count: 1 },
    { name: "Infection control - personal products > Gloves", count: 11 },
    { name: "Disposables", count: 3 },
  ]

  it("renders nothing without categories", () => {
    renderWithFilterNavigation(<CategoryFilter categories={[]} />)

    expect(screen.queryByRole("heading", { name: "Category" })).not.toBeInTheDocument()
  })

  it("collapses roots by default and rolls up their descendant counts", () => {
    renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    expect(screen.getByText("Endodontic products")).toBeInTheDocument()
    expect(screen.getByText("Infection control - personal products")).toBeInTheDocument()
    expect(screen.getByText("Disposables")).toBeInTheDocument()

    expect(screen.queryByText("Gloves")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Endodontic sealers & cements")).not.toBeInTheDocument()

    const row = screen.getByLabelText("Endodontic products").closest("div")?.parentElement
    expect(row).toHaveTextContent("3")
  })

  it("expands and collapses a root via its chevron", async () => {
    const user = userEvent.setup()
    renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    await user.click(screen.getByRole("button", { name: "Expand Endodontic products" }))

    expect(screen.getByLabelText("Endodontic sealers & cements")).toBeInTheDocument()
    expect(screen.getByLabelText("Endodontic accessories")).toBeInTheDocument()
    expect(screen.queryByLabelText("Endo organizers & accessories")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Collapse Endodontic products" }))

    expect(screen.queryByLabelText("Endodontic sealers & cements")).not.toBeInTheDocument()
  })

  it("selecting a root pushes just the root path", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    await user.click(screen.getByLabelText("Endodontic products"))

    expect(lastPushedParams(router).getAll("categories")).toEqual(["Endodontic products"])
  })

  it("selecting a leaf pushes its full path", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    await user.click(screen.getByRole("button", { name: "Expand Endodontic products" }))
    await user.click(screen.getByLabelText("Endodontic sealers & cements"))

    expect(lastPushedParams(router).getAll("categories")).toEqual([
      "Endodontic products > Endodontic sealers & cements",
    ])
  })

  it("auto-expands a branch that is already selected via the URL", () => {
    renderWithFilterNavigation(
      <CategoryFilter categories={categories} />,
      "categories=Endodontic+products+%3E+Endodontic+accessories",
    )

    const deepCheckbox = screen.getByLabelText("Endo organizers & accessories")
    expect(deepCheckbox).toBeInTheDocument()
    expect(deepCheckbox).toBeChecked()
    expect(deepCheckbox).toBeEnabled()

    const branchCheckbox = screen.getByLabelText("Endodontic accessories")
    expect(branchCheckbox).toBeChecked()
    expect(branchCheckbox).toBeEnabled()
  })

  it("excludes one child from an implicitly-selected branch, keeping siblings selected", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(
      <CategoryFilter categories={categories} />,
      "categories=Endodontic+products",
    )

    await user.click(screen.getByRole("button", { name: "Expand Endodontic accessories" }))
    await user.click(screen.getByLabelText("Endo organizers & accessories"))

    expect(lastPushedParams(router).getAll("categories")).toEqual([
      "Endodontic products > Endodontic sealers & cements",
    ])
  })

  it("marks the root checkbox indeterminate when only a descendant is selected", () => {
    renderWithFilterNavigation(
      <CategoryFilter categories={categories} />,
      "categories=Endodontic+products+%3E+Endodontic+accessories",
    )

    const rootCheckbox = screen.getByLabelText("Endodontic products")
    expect((rootCheckbox as HTMLInputElement).indeterminate).toBe(true)
  })

  it("selecting a parent drops an already-selected descendant", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(
      <CategoryFilter categories={categories} />,
      "categories=Endodontic+products+%3E+Endodontic+sealers+%26+cements",
    )

    await user.click(screen.getByLabelText("Endodontic products"))

    expect(lastPushedParams(router).getAll("categories")).toEqual(["Endodontic products"])
  })

  it("unchecking a selected path removes only it", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(
      <CategoryFilter categories={categories} />,
      "categories=Endodontic+products+%3E+Endodontic+sealers+%26+cements&categories=Disposables",
    )

    await user.click(screen.getByLabelText("Disposables"))

    expect(lastPushedParams(router).getAll("categories")).toEqual([
      "Endodontic products > Endodontic sealers & cements",
    ])
  })

  it("filters the tree by search, auto-expanding matches", async () => {
    const user = userEvent.setup()
    renderWithFilterNavigation(<CategoryFilter categories={categories} />)

    const searchBox = screen.getByPlaceholderText("Search categories...")
    await user.type(searchBox, "glove")

    expect(screen.getByText("Gloves")).toBeInTheDocument()
    expect(screen.queryByText("Disposables")).not.toBeInTheDocument()

    await user.clear(searchBox)
    await user.type(searchBox, "zzz")

    expect(screen.getByText("No categories found")).toBeInTheDocument()

    await user.clear(searchBox)

    expect(screen.getByText("Disposables")).toBeInTheDocument()
    expect(screen.queryByText("Gloves")).not.toBeInTheDocument()
  })

  it("Clear resets the selection", async () => {
    const user = userEvent.setup()
    const { router } = renderWithFilterNavigation(<CategoryFilter categories={categories} />, "categories=Disposables")

    await user.click(screen.getByRole("button", { name: "Clear" }))

    expect(lastPushedParams(router).getAll("categories")).toEqual([])
  })
})
