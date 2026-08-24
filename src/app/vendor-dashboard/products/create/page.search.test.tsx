import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import CreateProductPage from "./page"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("./components/BrandFilterDropdown", () => ({ default: () => null }))

const searchPage = (items: Array<{ id: string; name: string; brand?: string | null }>, last = true) => ({
  content: items.map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand ?? "MARK3",
    coverPhotoPath: null,
  })),
  totalElements: items.length,
  totalPages: 1,
  number: 0,
  size: 10,
  numberOfElements: items.length,
  first: true,
  last,
  empty: items.length === 0,
})

const serveSearch = (items: Array<{ id: string; name: string; brand?: string | null }>) => {
  server.use(http.get("*/api/products/active", () => HttpResponse.json(searchPage(items))))
}

const searchFor = async (user: ReturnType<typeof userEvent.setup>, query: string) => {
  await user.type(screen.getByPlaceholderText(/Search by barcode, name/), query)
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("CreateProductPage — product search", () => {
  it("asks an unauthenticated vendor to sign in", () => {
    useAuthStore.getState().clearAuth()

    render(<CreateProductPage />)

    expect(screen.getByRole("heading", { name: "Authentication Required" })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/Search by barcode, name/)).not.toBeInTheDocument()
  })

  it("opens on the search view, not the blank form", () => {
    render(<CreateProductPage />)

    expect(screen.getByRole("heading", { name: "Search Product" })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Product Name/)).not.toBeInTheDocument()
  })

  it("debounces the query and passes it to the backend", async () => {
    const user = userEvent.setup()
    const queries: string[] = []
    server.use(
      http.get("*/api/products/active", ({ request }) => {
        queries.push(new URL(request.url).searchParams.get("search") ?? "")
        return HttpResponse.json(searchPage([{ id: "p-1", name: "Composite Kit" }]))
      }),
    )

    render(<CreateProductPage />)
    await searchFor(user, "composite")

    await waitFor(() => expect(queries).toContain("composite"), { timeout: 4000 })
    // Only the settled value is requested, not one call per keystroke
    expect(queries.filter((q) => q === "composite")).toHaveLength(1)
  })

  it("lists matching products with their brand", async () => {
    const user = userEvent.setup()
    serveSearch([
      { id: "p-1", name: "Composite Kit", brand: "MARK3" },
      { id: "p-2", name: "Composite Gun", brand: "Acme" },
    ])

    render(<CreateProductPage />)
    await searchFor(user, "composite")

    expect(await screen.findByText("2 results found", undefined, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByText("Composite Kit")).toBeInTheDocument()
    expect(screen.getByText("Acme")).toBeInTheDocument()
  })

  it("offers a manual-entry escape hatch when nothing matches", async () => {
    const user = userEvent.setup()
    serveSearch([])

    render(<CreateProductPage />)
    await searchFor(user, "zzz")

    expect(await screen.findByText("No results found", undefined, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByText('No matching products for "zzz"')).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Create New Product/ }))
    expect(screen.getByLabelText(/Product Name/)).toHaveValue("")
  })

  it("clears the query and the results from the inline clear button", async () => {
    const user = userEvent.setup()
    serveSearch([{ id: "p-1", name: "Composite Kit" }])

    render(<CreateProductPage />)
    await searchFor(user, "composite")
    await screen.findByText("1 results found", undefined, { timeout: 4000 })

    const input = screen.getByPlaceholderText(/Search by barcode, name/)
    const clearButton = input.parentElement?.querySelector("button") as HTMLElement
    await user.click(clearButton)

    expect(input).toHaveValue("")
    expect(screen.queryByText("1 results found")).not.toBeInTheDocument()
  })

  it("fetches the full product before opening the details modal", async () => {
    const user = userEvent.setup()
    let detailRequests = 0
    server.use(
      http.get("*/api/products/:id", ({ params }) => {
        detailRequests += 1
        return HttpResponse.json(makeProduct({ id: String(params.id), name: "Composite Kit", brand: "MARK3" }))
      }),
    )
    // Registered last so it is matched before the `:id` handler above
    serveSearch([{ id: "p-1", name: "Composite Kit" }])

    render(<CreateProductPage />)
    await searchFor(user, "composite")

    await user.click(await screen.findByRole("button", { name: /Composite Kit/ }, { timeout: 4000 }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByLabelText("Stock *")).toBeInTheDocument()
    expect(detailRequests).toBe(1)
  })

  it("reports a failed detail lookup instead of opening an empty modal", async () => {
    const user = userEvent.setup()
    server.use(http.get("*/api/products/:id", () => new HttpResponse(null, { status: 500 })))
    serveSearch([{ id: "p-1", name: "Composite Kit" }])

    render(<CreateProductPage />)
    await searchFor(user, "composite")
    await user.click(await screen.findByRole("button", { name: /Composite Kit/ }, { timeout: 4000 }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalled())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("reports a failed search without leaving stale results on screen", async () => {
    const user = userEvent.setup()
    server.use(http.get("*/api/products/active", () => new HttpResponse(null, { status: 500 })))

    render(<CreateProductPage />)
    await searchFor(user, "composite")

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith(expect.stringContaining("Search error")), {
      timeout: 4000,
    })
    expect(screen.queryByText(/results found/)).not.toBeInTheDocument()
  })

  it("adds an existing catalogue product as a vendor listing straight from the modal", async () => {
    const user = userEvent.setup()
    let listingPayload: Record<string, unknown> | null = null
    server.use(
      http.get("*/api/products/:id", ({ params }) =>
        HttpResponse.json(makeProduct({ id: String(params.id), name: "Composite Kit" })),
      ),
      http.post("*/api/user-products", async ({ request }) => {
        listingPayload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: "up-1" })
      }),
    )
    serveSearch([{ id: "p-1", name: "Composite Kit" }])

    render(<CreateProductPage />)
    await searchFor(user, "composite")
    await user.click(await screen.findByRole("button", { name: /Composite Kit/ }, { timeout: 4000 }))

    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText("Price *"), "42")
    await user.type(within(dialog).getByLabelText("Stock *"), "7")
    await user.click(within(dialog).getByRole("button", { name: "Add Product" }))

    await waitFor(() => expect(listingPayload).not.toBeNull())
    expect(listingPayload).toMatchObject({ productId: "p-1", price: 42, stock: 7, discount: 0, active: true })
  })

  it("refuses to create a listing without a price", async () => {
    const user = userEvent.setup()
    const created = vi.fn()
    server.use(
      http.get("*/api/products/:id", ({ params }) =>
        HttpResponse.json(makeProduct({ id: String(params.id), name: "Composite Kit" })),
      ),
      http.post("*/api/user-products", () => {
        created()
        return HttpResponse.json({ id: "up-1" })
      }),
    )
    serveSearch([{ id: "p-1", name: "Composite Kit" }])

    render(<CreateProductPage />)
    await searchFor(user, "composite")
    await user.click(await screen.findByRole("button", { name: /Composite Kit/ }, { timeout: 4000 }))

    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Add Product" }))

    expect(await within(dialog).findByText("Price must be a positive number")).toBeInTheDocument()
    expect(created).not.toHaveBeenCalled()
  })
})
