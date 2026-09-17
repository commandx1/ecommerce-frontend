import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { render, screen, within } from "@/test/render"
import { BACKEND } from "@/test/route-harness"

const { default: CategoriesRoutePage } = await import("./page")

const CATEGORIES = `${BACKEND}/api/products/categories`

const getGrid = (input: HTMLElement) => {
  const gridId = input.getAttribute("aria-controls")
  const grid = gridId ? document.getElementById(gridId) : null
  return grid
}

// Each tile's own child-category chips are also rendered as <li>s, so counting tiles means
// counting the grid's direct <li> children, not every `listitem` role in the subtree.
const tileCount = (grid: HTMLElement) => grid.querySelectorAll(":scope > li").length

describe("CategoriesRoutePage", () => {
  it("renders featured categories and the full directory from the backend's counts", async () => {
    server.use(
      http.get(CATEGORIES, () =>
        HttpResponse.json([
          { name: "Instruments > Diagnostic instruments", count: 3 },
          { name: "Instruments > Hygiene instruments", count: 2 },
          { name: "Preventives > Fluorides", count: 1 },
        ]),
      ),
    )

    render(await CategoriesRoutePage(), { route: "/categories" })

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("heading", { name: "Most stocked right now" })).toBeInTheDocument()

    const featuredHeading = screen.getByRole("heading", { name: "Most stocked right now" })
    const featuredGrid = featuredHeading.nextElementSibling as HTMLElement
    expect(within(featuredGrid).getByText("Instruments")).toBeInTheDocument()
    expect(within(featuredGrid).getByText("5 products")).toBeInTheDocument()

    const input = screen.getByLabelText("Find a category")
    const grid = getGrid(input)
    expect(grid).not.toBeNull()
    expect(tileCount(grid as HTMLElement)).toBe(41)
    const gridScope = within(grid as HTMLElement)

    expect(gridScope.getByRole("link", { name: "Instruments" })).toHaveAttribute(
      "href",
      "/products?categories=Instruments",
    )
    expect(gridScope.getByRole("link", { name: "Diagnostic instruments" })).toHaveAttribute(
      "href",
      "/products?categories=Instruments%20%3E%20Diagnostic%20instruments",
    )
    expect(gridScope.getAllByText("Coming soon").length).toBeGreaterThan(0)
  })

  it("still renders the full directory with zero counts when the categories endpoint fails", async () => {
    server.use(http.get(CATEGORIES, () => new HttpResponse(null, { status: 500 })))

    render(await CategoriesRoutePage(), { route: "/categories" })

    expect(screen.queryByRole("heading", { name: "Most stocked right now" })).not.toBeInTheDocument()

    const input = screen.getByLabelText("Find a category")
    const grid = getGrid(input)
    expect(tileCount(grid as HTMLElement)).toBe(41)
    expect(screen.getByText(/0 products/)).toBeInTheDocument()
  })

  it("filters the directory by query and clears back to the full list", async () => {
    const user = userEvent.setup()
    render(await CategoriesRoutePage(), { route: "/categories" })

    const input = screen.getByLabelText("Find a category")

    await user.type(input, "Orthodontic")
    const filteredGrid = getGrid(input)
    expect(tileCount(filteredGrid as HTMLElement)).toBe(1)

    await user.clear(input)
    await user.type(input, "zzzz")
    expect(screen.getByText(/No categories match/)).toBeInTheDocument()
    expect(getGrid(input)).toBeNull()

    await user.click(screen.getByRole("button", { name: "Clear filter" }))
    const restoredGrid = getGrid(input)
    expect(tileCount(restoredGrid as HTMLElement)).toBe(41)
  })
})
