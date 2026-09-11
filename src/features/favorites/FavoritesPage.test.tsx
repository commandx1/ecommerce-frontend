import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { render, screen } from "@/test/render"
import FavoritesPage from "./FavoritesPage"

vi.mock("@/features/favorites/FavoriteProductsTab", () => ({
  default: () => <div data-testid="products-tab-stub" />,
}))

vi.mock("@/features/suppliers/FavoriteSuppliersPage", () => ({
  default: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="vendors-tab-stub" data-embedded={embedded ? "true" : "false"} />
  ),
}))

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("FavoritesPage tab selection", () => {
  it("renders the products tab and selects it when there is no ?tab param", () => {
    render(<FavoritesPage />, { route: "/buyer-dashboard/favorites" })

    expect(screen.getByTestId("products-tab-stub")).toBeInTheDocument()
    expect(screen.queryByTestId("vendors-tab-stub")).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Products" })).toHaveAttribute("data-state", "active")
  })

  it("renders the vendors tab embedded when ?tab=vendors", () => {
    render(<FavoritesPage />, { route: "/buyer-dashboard/favorites", searchParams: "tab=vendors" })

    expect(screen.getByTestId("vendors-tab-stub")).toHaveAttribute("data-embedded", "true")
    expect(screen.queryByTestId("products-tab-stub")).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Vendors" })).toHaveAttribute("data-state", "active")
  })

  it("falls back to the products tab for an unrecognized ?tab value", () => {
    render(<FavoritesPage />, { route: "/buyer-dashboard/favorites", searchParams: "tab=bogus" })

    expect(screen.getByTestId("products-tab-stub")).toBeInTheDocument()
    expect(screen.queryByTestId("vendors-tab-stub")).not.toBeInTheDocument()
  })
})

describe("FavoritesPage tab navigation", () => {
  it("replaces the URL with ?tab=vendors when the Vendors tab is clicked", async () => {
    const user = userEvent.setup()
    render(<FavoritesPage />, { route: "/buyer-dashboard/favorites" })

    await user.click(screen.getByRole("tab", { name: "Vendors" }))

    expect(getRouterMock().replace).toHaveBeenCalledWith("/buyer-dashboard/favorites?tab=vendors", { scroll: false })
  })

  it("replaces the URL with no query when the Products tab is clicked while on vendors", async () => {
    const user = userEvent.setup()
    render(<FavoritesPage />, { route: "/buyer-dashboard/favorites", searchParams: "tab=vendors" })

    await user.click(screen.getByRole("tab", { name: "Products" }))

    expect(getRouterMock().replace).toHaveBeenCalledWith("/buyer-dashboard/favorites", { scroll: false })
  })
})

describe("FavoritesPage heading", () => {
  it("has exactly one h1 named Favorites", () => {
    render(<FavoritesPage />, { route: "/buyer-dashboard/favorites" })

    const headings = screen.getAllByRole("heading", { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent("Favorites")
  })
})
