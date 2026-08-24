import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorListItem } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor, within } from "@/test/render"
import SuppliersDirectorySection from "./SuppliersDirectorySection.client"

installRadixPointerPolyfills()

const mockToastWarning = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    warning: (...args: unknown[]) => mockToastWarning(...args),
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

interface VendorQuery {
  page: string | null
  size: string | null
  sort: string | null
  minRating: string | null
}

let queries: VendorQuery[]
let favoriteWrites: Array<{ method: string; vendorId: string }>

const vendorPage = (vendors = [makeVendorListItem()], totalCount = 1, totalPages = 1) => ({
  vendors,
  totalCount,
  page: 0,
  size: 6,
  totalPages,
})

const installVendorHandlers = (response = vendorPage()) => {
  server.use(
    http.get("*/backend-api/vendors", ({ request }) => {
      const params = new URL(request.url).searchParams
      queries.push({
        page: params.get("page"),
        size: params.get("size"),
        sort: params.get("sort"),
        minRating: params.get("minRating"),
      })
      return HttpResponse.json(response)
    }),
  )
}

const signIn = () => useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")

const user = () => userEvent.setup({ pointerEventsCheck: 0 })

describe("SuppliersDirectorySection", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    queries = []
    favoriteWrites = []
    mockToastWarning.mockClear()
    server.use(
      http.post("*/backend-api/vendors/:vendorId/favorite", ({ params }) => {
        favoriteWrites.push({ method: "POST", vendorId: String(params.vendorId) })
        return new HttpResponse(null, { status: 200 })
      }),
      http.delete("*/backend-api/vendors/:vendorId/favorite", ({ params }) => {
        favoriteWrites.push({ method: "DELETE", vendorId: String(params.vendorId) })
        return new HttpResponse(null, { status: 200 })
      }),
    )
  })

  it("asks for the first page sorted by rating and lists what comes back", async () => {
    installVendorHandlers()
    render(<SuppliersDirectorySection />)

    expect(await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })).toBeInTheDocument()
    expect(queries[0]).toEqual({ page: "0", size: "6", sort: "rating", minRating: null })
    expect(screen.getByText(/Showing 1 verified vendors/)).toBeInTheDocument()
  })

  it("shows a loading state before the first response lands", () => {
    installVendorHandlers()
    render(<SuppliersDirectorySection />)

    expect(screen.getByText("Loading vendors…")).toBeInTheDocument()
  })

  it("explains an empty result instead of showing an empty grid", async () => {
    installVendorHandlers(vendorPage([], 0, 1))
    render(<SuppliersDirectorySection />)

    expect(
      await screen.findByText("No vendors match these filters. Clear one or more filters to see available vendors."),
    ).toBeInTheDocument()
  })

  it("reports a failed vendor lookup", async () => {
    server.use(http.get("*/backend-api/vendors", () => new HttpResponse(null, { status: 500 })))
    render(<SuppliersDirectorySection />)

    expect(await screen.findByText("Unable to load vendors. Please try again later.")).toBeInTheDocument()
  })

  it("translates the rating filter into a minRating query", async () => {
    installVendorHandlers()
    render(<SuppliersDirectorySection />)
    await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

    const events = user()
    await events.click(screen.getByRole("combobox", { name: "Filter by rating" }))
    await events.click(await screen.findByRole("option", { name: "4+ Stars" }))

    await waitFor(() => expect(queries.at(-1)?.minRating).toBe("4"))
  })

  it("translates each sort choice into its API name", async () => {
    installVendorHandlers()
    render(<SuppliersDirectorySection />)
    await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

    const events = user()
    await events.click(screen.getByRole("combobox", { name: "Sort suppliers" }))
    await events.click(await screen.findByRole("option", { name: "Most Reviews" }))

    await waitFor(() => expect(queries.at(-1)?.sort).toBe("reviewCount"))
  })

  it("returns to the first page when a filter changes", async () => {
    installVendorHandlers(vendorPage([makeVendorListItem()], 18, 3))
    render(<SuppliersDirectorySection />)
    await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

    const events = user()
    await events.click(screen.getByRole("button", { name: "3" }))
    await waitFor(() => expect(queries.at(-1)?.page).toBe("2"))

    await events.click(screen.getByRole("combobox", { name: "Sort suppliers" }))
    await events.click(await screen.findByRole("option", { name: "A-Z" }))

    await waitFor(() => expect(queries.at(-1)).toMatchObject({ page: "0", sort: "name" }))
  })

  describe("pagination", () => {
    it("stays hidden while everything fits on one page", async () => {
      installVendorHandlers()
      render(<SuppliersDirectorySection />)
      await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

      expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument()
    })

    it("describes the visible slice and disables the edge controls", async () => {
      installVendorHandlers(vendorPage([makeVendorListItem()], 14, 3))
      render(<SuppliersDirectorySection />)
      await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

      expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled()
      const summary = screen.getAllByText(/suppliers/).find((node) => node.textContent?.startsWith("Showing 1"))
      expect(summary?.textContent).toBe("Showing 1–6 of 14 suppliers")
    })

    it("walks forward a page at a time", async () => {
      installVendorHandlers(vendorPage([makeVendorListItem()], 14, 3))
      render(<SuppliersDirectorySection />)
      await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

      await user().click(screen.getByRole("button", { name: "Next page" }))

      await waitFor(() => expect(queries.at(-1)?.page).toBe("1"))
      expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled()
    })
  })

  describe("favourites", () => {
    it("tells an anonymous visitor to sign in and writes nothing", async () => {
      installVendorHandlers()
      render(<SuppliersDirectorySection />)
      await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

      await user().click(screen.getByRole("button", { name: "Save to favorites" }))

      expect(mockToastWarning).toHaveBeenCalledWith("Login required", expect.any(String))
      expect(favoriteWrites).toEqual([])
    })

    it("marks the vendors already favourited by the signed-in buyer", async () => {
      signIn()
      installVendorHandlers()
      server.use(http.get("*/backend-api/vendors/favorite-ids", () => HttpResponse.json(["vendor-1"])))
      render(<SuppliersDirectorySection />)

      expect(await screen.findByRole("button", { name: "Remove from favorites" })).toBeInTheDocument()
    })

    it("flips the heart before the write lands", async () => {
      signIn()
      installVendorHandlers()
      server.use(http.get("*/backend-api/vendors/favorite-ids", () => HttpResponse.json([])))
      render(<SuppliersDirectorySection />)
      await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

      await user().click(screen.getByRole("button", { name: "Save to favorites" }))

      expect(await screen.findByRole("button", { name: "Remove from favorites" })).toBeInTheDocument()
      await waitFor(() => expect(favoriteWrites).toEqual([{ method: "POST", vendorId: "vendor-1" }]))
    })

    it("rolls the heart back when the write fails", async () => {
      signIn()
      installVendorHandlers()
      server.use(
        http.get("*/backend-api/vendors/favorite-ids", () => HttpResponse.json([])),
        http.post("*/backend-api/vendors/:vendorId/favorite", () => new HttpResponse(null, { status: 500 })),
      )
      render(<SuppliersDirectorySection />)
      await screen.findByRole("heading", { name: "Acme Dental Supplies", level: 3 })

      await user().click(screen.getByRole("button", { name: "Save to favorites" }))

      expect(await screen.findByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
    })

    it("removes an existing favourite with a DELETE", async () => {
      signIn()
      installVendorHandlers()
      server.use(http.get("*/backend-api/vendors/favorite-ids", () => HttpResponse.json(["vendor-1"])))
      render(<SuppliersDirectorySection />)

      await user().click(await screen.findByRole("button", { name: "Remove from favorites" }))

      await waitFor(() => expect(favoriteWrites).toEqual([{ method: "DELETE", vendorId: "vendor-1" }]))
    })
  })
})
