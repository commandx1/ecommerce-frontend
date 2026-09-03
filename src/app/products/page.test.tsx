import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { render, screen } from "@/test/render"
import { BACKEND, createCapture, record } from "@/test/route-harness"

/**
 * `getListingPageData` fans out six backend calls and every one of them already degrades to an
 * empty/fallback value on failure (see `get-listing-page-data.ts` and its own test file) — a
 * 500 or a network error on `/api/products/public` therefore never reaches this page's `catch`,
 * it just renders an empty grid. The page's `try/catch` is still a real backstop for whatever
 * *does* throw (a genuinely unexpected error), so it's exercised here the same way the sibling
 * `products/[id]/page.test.tsx` exercises its own page-level catch: by making the fetch reject.
 */
vi.mock("@/features/products/listing/server/get-listing-page-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/products/listing/server/get-listing-page-data")>()
  return { ...actual, getListingPageData: vi.fn(actual.getListingPageData) }
})

import { getListingPageData } from "@/features/products/listing/server/get-listing-page-data"
import type { ListingSearchParams } from "@/features/products/listing/server/parse-listing-search-params"

// Imported after the mock above so it picks up the mocked module.
const { default: ProductListingPage } = await import("./page")

const PRODUCTS = `${BACKEND}/api/products/public`

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
  reorderId: "R-1",
  referanceNumber: "REF-1",
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
  beforeEach(() => {
    vi.mocked(getListingPageData).mockClear()
  })

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
    expect(screen.getAllByText("Consumables").length).toBeGreaterThan(0) // categories
  })

  it("shows a friendly error screen, not a crash, when the page's data fetch throws", async () => {
    vi.mocked(getListingPageData).mockRejectedValueOnce(new Error("Something exploded upstream"))

    const element = await ProductListingPage(makeProps())
    render(element, { route: "/products" })

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument()
    expect(screen.getByText("We couldn't load the products. Please try again later.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Retry" })).toHaveAttribute("href", "/products")
    expect(screen.queryByText("Intra Oral Mixing Tips")).not.toBeInTheDocument()
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
    // Requested size 9999 -> clamped to MAX_PAGE_SIZE (60).
    expect(query.get("size")).toBe("60")
    // Invalid sort -> falls back to "best-match", which is omitted from the query entirely.
    expect(query.has("sort")).toBe(false)

    expect(screen.getByRole("heading", { name: "Dental Products" })).toBeInTheDocument()
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument()
  })
})
