import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeVendorListItem } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
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

  /**
   * C axis. `GET /vendors/favorites` is typed `List<VendorListItemDto>` (VendorController:44-49),
   * but a malformed 200 - a partial body, a proxy hiccup - hands back something that is not an
   * array. The page calls `vendors.some(...)` and `vendors.map(...)` unconditionally, so an
   * unguarded value throws and blanks the whole page rather than degrading to an empty list.
   * This is infra note #26's root pattern; it was found in nineteen other places this week.
   */
  it.each([
    ["an object", { nope: true }],
    ["a string", "not-a-list"],
    ["a number", 7],
    ["null", null],
  ])("shows the empty state instead of crashing when the response is %s", async (_label, body) => {
    server.use(http.get("*/backend-api/vendors/favorites", () => HttpResponse.json(body)))
    render(<FavoriteSuppliersPage />)

    expect(await screen.findByText("No favorite vendors yet.")).toBeInTheDocument()
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

  it("hides its own heading when embedded", async () => {
    render(<FavoriteSuppliersPage embedded />)
    await screen.findByRole("heading", { name: "Acme Dental", level: 3 })

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })
})
