import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { type ListingSearchParams, MAX_PAGE_SIZE } from "@/features/products/listing/server/parse-listing-search-params"
import { server } from "@/mocks/server"
import { render, screen } from "@/test/render"
import { BACKEND, createCapture, record } from "@/test/route-harness"

/**
 * `getListingPageData` no longer swallows a failure of the product-list call — a 500 or network
 * error on `/api/products/public` rejects `getListingPageData`, and the page's `try/catch` renders
 * `<ProductListingErrorState />` instead of a silently empty grid (product decision, 3 Sep 2026).
 * The five filter-facet fetchers still degrade gracefully, so a facet outage alone must not
 * trigger the error screen — that boundary is exercised below too.
 */

const { default: ProductListingPage } = await import("./page")

const PRODUCTS = `${BACKEND}/api/products/public`
const BRANDS = `${BACKEND}/api/products/brands`

const makeProps = (searchParams: ListingSearchParams = {}) => ({
  searchParams: Promise.resolve(searchParams),
})

// The default `/api/products/public` MSW handler serves a `Product` (vendor/admin shape, `name`)
// rather than the public listing's `APIProduct` shape (`productName`, `coverPhotoPath`, `price`,
// ...) — see `ProductListingClient.test.tsx`'s own local factory for the real contract. Override
// it here with a fixture the listing grid actually renders.
const listingProduct = {
  productId: "p-1",
  productName: "Intra Oral Mixing Tips",
  brand: "MARK3",
  barcode: "123456789012",
  coverPhotoPath: "/uploads/tips.png",
  manufacturerCode: "M-1",
  overallStar: 4.5,
  reviewCount: 12,
  vendorsCount: 3,
  bestPriceVendor: "Acme Dental",
  price: 56,
  oldPrice: 70,
  discount: 20,
  stock: 40,
}

describe("ProductListingPage", () => {
  it("renders the listing view with the backend's products and filter facets", async () => {
    server.use(
      http.get(PRODUCTS, () => HttpResponse.json({ content: [listingProduct], totalElements: 1, totalPages: 1 })),
    )

    const element = await ProductListingPage(makeProps())
    render(element, { route: "/products" })

    expect(await screen.findByText("Intra Oral Mixing Tips")).toBeInTheDocument()
    // Filter sidebars received the option lists from the other five default handlers.
    expect(screen.getAllByText("MARK3").length).toBeGreaterThan(0) // brands + manufacturers
    // Mobile and desktop filter panels both render (see ProductListingClient.test.tsx), so more
    // than one node is expected here.
    expect(screen.getAllByText("Infection control - personal products").length).toBeGreaterThan(0) // categories (collapsed root)
  })

  it("shows a friendly error screen, not a crash, when the product list fails to load", async () => {
    server.use(http.get(PRODUCTS, () => new HttpResponse(null, { status: 500 })))

    const element = await ProductListingPage(makeProps())
    render(element, { route: "/products" })

    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeInTheDocument()
    expect(screen.getByText("We couldn't load the products. Please try again later.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Retry" })).toHaveAttribute("href", "/products")
    expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument()
  })

  it("shows the error screen when the backend is unreachable for the product list", async () => {
    server.use(http.get(PRODUCTS, () => HttpResponse.error()))

    const element = await ProductListingPage(makeProps())
    render(element, { route: "/products" })

    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Retry" })).toHaveAttribute("href", "/products")
  })

  it("renders the listing, not the error screen, when only a filter facet fails", async () => {
    server.use(
      http.get(PRODUCTS, () => HttpResponse.json({ content: [listingProduct], totalElements: 1, totalPages: 1 })),
      http.get(BRANDS, () => new HttpResponse(null, { status: 500 })),
    )

    const element = await ProductListingPage(makeProps())
    render(element, { route: "/products" })

    expect(await screen.findByText("Intra Oral Mixing Tips")).toBeInTheDocument()
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument()
  })

  it("forwards the page and sort search params to the backend request", async () => {
    const captured = createCapture()
    server.use(
      http.get(PRODUCTS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ content: [], totalElements: 0, totalPages: 1 })
      }),
    )

    const element = await ProductListingPage(makeProps({ page: "2", sort: "price-asc" }))
    render(element, { route: "/products" })

    const query = new URL(captured.url ?? "").searchParams
    // displayPage 2 -> apiPage 1 (0-indexed).
    expect(query.get("page")).toBe("1")
    expect(query.get("sort")).toBe("price-asc")
  })

  it("clamps an out-of-range page size and defaults an invalid sort instead of throwing", async () => {
    // `parseListingSearchParams` never throws on malformed input (read the source: every field
    // falls back to a safe default or is clamped). This documents that behaviour rather than
    // inventing a throw path that doesn't exist.
    const captured = createCapture()
    server.use(
      http.get(PRODUCTS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ content: [listingProduct], totalElements: 1, totalPages: 1 })
      }),
    )

    const element = await ProductListingPage(makeProps({ page: "not-a-number", size: "9999", sort: "nonsense" }))
    render(element, { route: "/products" })

    const query = new URL(captured.url ?? "").searchParams
    // Invalid page -> default displayPage 1 -> apiPage 0.
    expect(query.get("page")).toBe("0")
    // Requested size 9999 -> clamped to MAX_PAGE_SIZE (backend rejects anything above it).
    expect(query.get("size")).toBe(String(MAX_PAGE_SIZE))
    // Invalid sort -> falls back to "best-match", which is omitted from the query entirely.
    expect(query.has("sort")).toBe(false)

    expect(screen.getByRole("heading", { name: "Dental Products" })).toBeInTheDocument()
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument()
  })
})
