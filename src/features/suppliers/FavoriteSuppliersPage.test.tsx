import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeVendorListItem } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import FavoriteSuppliersPage from "./FavoriteSuppliersPage"

const mockToastError = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const favorites = [
  makeVendorListItem({ id: "vendor-1", name: "Acme Dental" }),
  makeVendorListItem({ id: "vendor-2", name: "Beta Supplies", averageRating: 3.4, reviewCount: 12 }),
]

describe("FavoriteSuppliersPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastError.mockClear()
    server.use(http.get("*/backend-api/vendors/favorites", () => HttpResponse.json(favorites)))
  })

  it("lists the buyer's starred vendors as cards by default", async () => {
    render(<FavoriteSuppliersPage />)

    expect(await screen.findByRole("heading", { name: "Acme Dental", level: 3 })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Grid/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("switches between the card and table presentations", async () => {
    const user = userEvent.setup()
    render(<FavoriteSuppliersPage />)
    await screen.findByRole("heading", { name: "Acme Dental", level: 3 })

    await user.click(screen.getByRole("button", { name: /Table/ }))

    const table = screen.getByRole("table")
    expect(within(table).getByText("Acme Dental")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Table/ })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: /Grid/ }))
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("says so when nothing has been starred yet", async () => {
    server.use(http.get("*/backend-api/vendors/favorites", () => HttpResponse.json([])))
    render(<FavoriteSuppliersPage />)

    expect(await screen.findByText("No favorite vendors yet.")).toBeInTheDocument()
  })

  it("reports a failed lookup", async () => {
    server.use(http.get("*/backend-api/vendors/favorites", () => new HttpResponse(null, { status: 500 })))
    render(<FavoriteSuppliersPage />)

    expect(await screen.findByText("Unable to load favorite vendors. Please try again later.")).toBeInTheDocument()
  })

  it("drops a vendor from the list immediately and sends the DELETE", async () => {
    const user = userEvent.setup()
    let deletedId: string | undefined
    server.use(
      http.delete("*/backend-api/vendors/:vendorId/favorite", ({ params }) => {
        deletedId = String(params.vendorId)
        return new HttpResponse(null, { status: 200 })
      }),
    )
    render(<FavoriteSuppliersPage />)
    await screen.findByRole("heading", { name: "Acme Dental", level: 3 })

    await user.click(screen.getAllByRole("button", { name: "Remove from favorites" })[0])

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Acme Dental", level: 3 })).not.toBeInTheDocument(),
    )
    expect(deletedId).toBe("vendor-1")
    expect(screen.getByRole("heading", { name: "Beta Supplies", level: 3 })).toBeInTheDocument()
  })

  it("restores the list from the server when the removal fails", async () => {
    const user = userEvent.setup()
    server.use(http.delete("*/backend-api/vendors/:vendorId/favorite", () => new HttpResponse(null, { status: 500 })))
    render(<FavoriteSuppliersPage />)
    await screen.findByRole("heading", { name: "Acme Dental", level: 3 })

    await user.click(screen.getAllByRole("button", { name: "Remove from favorites" })[0])

    expect(await screen.findByRole("heading", { name: "Acme Dental", level: 3 })).toBeInTheDocument()
    expect(mockToastError).toHaveBeenCalledWith("Action failed", expect.any(String))
  })

  it("removes a vendor from the table view too", async () => {
    const user = userEvent.setup()
    let deletedId: string | undefined
    server.use(
      http.delete("*/backend-api/vendors/:vendorId/favorite", ({ params }) => {
        deletedId = String(params.vendorId)
        return new HttpResponse(null, { status: 200 })
      }),
    )
    render(<FavoriteSuppliersPage />)
    await screen.findByRole("heading", { name: "Acme Dental", level: 3 })
    await user.click(screen.getByRole("button", { name: /Table/ }))

    const rows = within(screen.getByRole("table")).getAllByRole("row")
    await user.click(within(rows[2]).getByRole("button", { name: "Remove from favorites" }))

    await waitFor(() => expect(deletedId).toBe("vendor-2"))
  })
})
