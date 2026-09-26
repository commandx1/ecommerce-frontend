import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SearchProduct } from "@/lib/api/product-search"
import { server } from "@/mocks/server"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { render, screen, waitFor } from "@/test/render"
import MainSearchbox from "./MainSearchbox"

const makeSearchProduct = (overrides: Partial<SearchProduct> = {}): SearchProduct => ({
  productId: "p-1",
  productName: "Intra Oral Mixing Tips",
  barcode: "123456789012",
  coverPhotoPath: "/uploads/tips.png",
  secureCode: "sec-1",
  manufacturerCode: "M-1",
  userId: "vendor-1",
  price: 56,
  oldPrice: 70,
  discount: 20,
  stock: 40,
  ...overrides,
})

let queries: string[]

const installSearchHandler = (content: SearchProduct[] = [makeSearchProduct()]) => {
  server.use(
    http.get("*/api/products/public-search", ({ request }) => {
      queries.push(new URL(request.url).searchParams.get("search") ?? "")
      return HttpResponse.json({ content })
    }),
  )
}

const searchBox = () => screen.getByPlaceholderText("Search products, brands, or suppliers...")

describe("MainSearchbox", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    queries = []
  })

  it("shows no dropdown before anything is typed", () => {
    installSearchHandler()
    render(<MainSearchbox />)

    expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument()
  })

  it("searches after the typing pause and lists the matches", async () => {
    const user = userEvent.setup()
    installSearchHandler()
    render(<MainSearchbox />)

    await user.type(searchBox(), "tips")

    expect(await screen.findByText("Intra Oral Mixing Tips")).toBeInTheDocument()
    expect(queries.at(-1)).toBe("tips")
  })

  it("collapses a burst of keystrokes into a single request", async () => {
    const user = userEvent.setup()
    installSearchHandler()
    render(<MainSearchbox />)

    await user.type(searchBox(), "tips")
    await screen.findByText("Intra Oral Mixing Tips")

    expect(queries).toEqual(["tips"])
  })

  // The dropdown has a "No results found" branch, but `useMainSearch` only opens the dropdown
  // when at least one result came back — so an empty result set shows nothing at all.
  it("shows no empty-state dropdown when nothing matches (current behaviour)", async () => {
    const user = userEvent.setup()
    installSearchHandler([])
    render(<MainSearchbox />)

    await user.type(searchBox(), "zzz")

    await waitFor(() => expect(queries).toHaveLength(1))
    expect(screen.queryByText("No results found")).not.toBeInTheDocument()
  })

  it("clears the query and closes the dropdown when a result is opened", async () => {
    const user = userEvent.setup()
    installSearchHandler()
    render(<MainSearchbox />)

    await user.type(searchBox(), "tips")
    await user.click(await screen.findByText("Intra Oral Mixing Tips"))

    await waitFor(() => expect(searchBox()).toHaveValue(""))
    expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument()
  })

  it("drops the dropdown when the field is emptied again", async () => {
    const user = userEvent.setup()
    installSearchHandler()
    render(<MainSearchbox />)

    await user.type(searchBox(), "tips")
    await screen.findByText("Intra Oral Mixing Tips")
    await user.clear(searchBox())

    await waitFor(() => expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument())
  })

  it("closes the dropdown on a click outside the searchbox", async () => {
    const user = userEvent.setup()
    installSearchHandler()
    render(
      <div>
        <MainSearchbox />
        <button type="button">elsewhere</button>
      </div>,
    )

    await user.type(searchBox(), "tips")
    await screen.findByText("Intra Oral Mixing Tips")
    await user.click(screen.getByRole("button", { name: "elsewhere" }))

    await waitFor(() => expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument())
  })

  it("reopens the previous results when the field regains focus", async () => {
    const user = userEvent.setup()
    installSearchHandler()
    render(
      <div>
        <MainSearchbox />
        <button type="button">elsewhere</button>
      </div>,
    )

    await user.type(searchBox(), "tips")
    await screen.findByText("Intra Oral Mixing Tips")
    await user.click(screen.getByRole("button", { name: "elsewhere" }))
    await waitFor(() => expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument())

    await user.click(searchBox())

    expect(await screen.findByText("Intra Oral Mixing Tips")).toBeInTheDocument()
    expect(queries).toEqual(["tips"])
  })

  // BULGU (TEST-FINDINGS): there is no minimum query length — a single character already
  // triggers a backend search on every storefront page that mounts the navbar.
  it("searches on a single character (current behaviour)", async () => {
    const user = userEvent.setup()
    installSearchHandler()
    render(<MainSearchbox />)

    await user.type(searchBox(), "t")

    await waitFor(() => expect(queries).toEqual(["t"]))
  })

  describe("submitting to /products", () => {
    it("pressing Enter submits the form and navigates to /products?q=<query>", async () => {
      const user = userEvent.setup()
      installSearchHandler()
      render(<MainSearchbox />)

      await user.type(searchBox(), "tips{Enter}")

      expect(getRouterMock().push).toHaveBeenCalledWith("/products?q=tips")
    })

    it("clicking the magnifier button submits the form", async () => {
      const user = userEvent.setup()
      installSearchHandler()
      render(<MainSearchbox />)

      await user.type(searchBox(), "tips")
      await user.click(screen.getByRole("button", { name: "Search" }))

      expect(getRouterMock().push).toHaveBeenCalledWith("/products?q=tips")
    })

    it("does nothing when the query is empty", async () => {
      const user = userEvent.setup()
      installSearchHandler()
      render(<MainSearchbox />)

      await user.click(screen.getByRole("button", { name: "Search" }))

      expect(getRouterMock().push).not.toHaveBeenCalled()
    })

    it("closes the dropdown after submitting", async () => {
      const user = userEvent.setup()
      installSearchHandler()
      render(<MainSearchbox />)

      await user.type(searchBox(), "tips")
      await screen.findByText("Intra Oral Mixing Tips")

      await user.click(screen.getByRole("button", { name: "Search" }))

      await waitFor(() => expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument())
    })

    it("shows a 'See all results' row that navigates to /products?q=<query> and closes the dropdown", async () => {
      const user = userEvent.setup()
      installSearchHandler()
      render(<MainSearchbox />)

      await user.type(searchBox(), "tips")
      const seeAll = await screen.findByRole("link", { name: "See all results for “tips”" })
      expect(seeAll).toHaveAttribute("href", "/products?q=tips")

      await user.click(seeAll)
      await waitFor(() => expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument())
    })
  })

  it("prefills the box from the q search param when landing on /products", () => {
    installSearchHandler()
    render(<MainSearchbox />, { route: "/products", searchParams: "q=implant" })

    expect(searchBox()).toHaveValue("implant")
  })
})
