import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"

// `product-detail.ts` is a "use server" module that reads the access token from the
// `auth-storage` cookie via `next/headers`. Mock it per test so we can control whether a
// token is present without going through real Next.js request-scoped cookies.
const mockCookiesGet = vi.fn<(name: string) => { value: string } | undefined>()

vi.mock("next/headers", () => ({
  cookies: () => ({ get: mockCookiesGet }),
}))

const { fetchProductDetailPageData, fetchProductReviews } = await import("./product-detail")

function setAuthCookie(accessToken: string | null) {
  if (accessToken === null) {
    mockCookiesGet.mockReturnValue(undefined)
    return
  }
  mockCookiesGet.mockReturnValue({ value: JSON.stringify({ state: { accessToken } }) })
}

const mockWithUserProducts = {
  product: {
    id: "p-1",
    name: "Intra Oral Mixing Tips",
    price: 56,
    coverPhotoPath: "/uploads/tips.png",
  },
  userProducts: [{ id: "up-1", price: 56, stock: 40 }],
}

const mockQuestionsResponse = {
  content: [],
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: { empty: true, unsorted: true, sorted: false },
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalPages: 0,
  totalElements: 0,
  size: 10,
  number: 0,
  sort: { empty: true, unsorted: true, sorted: false },
  numberOfElements: 0,
  first: true,
  empty: true,
}

const mockReviewsResponse = {
  content: [],
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: { empty: true, unsorted: true, sorted: false },
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalPages: 0,
  totalElements: 0,
  size: 10,
  number: 0,
  sort: { empty: true, unsorted: true, sorted: false },
  numberOfElements: 0,
  first: true,
  empty: true,
}

let capturedMeAuthHeader: string | null | undefined
let capturedProductAuthHeader: string | null | undefined
let capturedQuestionsQuery: URLSearchParams | null = null
let capturedReviewsQuery: URLSearchParams | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. Registered per test because the global setup resets handlers after every test case.
 */
beforeEach(() => {
  setAuthCookie(null)
  capturedMeAuthHeader = undefined
  capturedProductAuthHeader = undefined
  capturedQuestionsQuery = null
  capturedReviewsQuery = null

  server.use(
    http.get("*/api/users/me", ({ request }) => {
      capturedMeAuthHeader = request.headers.get("authorization")
      return HttpResponse.json({})
    }),
    http.get("*/api/products/:id/with-user-products", ({ request }) => {
      capturedProductAuthHeader = request.headers.get("authorization")
      return HttpResponse.json(mockWithUserProducts)
    }),
    http.get("*/api/product-questions/product/:id", ({ request }) => {
      capturedQuestionsQuery = new URL(request.url).searchParams
      return HttpResponse.json(mockQuestionsResponse)
    }),
    http.get("*/api/reviews/product/:productId", ({ request }) => {
      capturedReviewsQuery = new URL(request.url).searchParams
      return HttpResponse.json(mockReviewsResponse)
    }),
  )
})

describe("fetchProductDetailPageData contract", () => {
  it("returns the typed page data (product + questions) on success", async () => {
    const result = await fetchProductDetailPageData("p-1")

    expect(result.productData).toEqual(mockWithUserProducts)
    expect(result.questions).toEqual(mockQuestionsResponse)
  })

  it("requests page=0 size=10 for the questions call", async () => {
    await fetchProductDetailPageData("p-1")

    expect(capturedQuestionsQuery?.get("page")).toBe("0")
    expect(capturedQuestionsQuery?.get("size")).toBe("10")
  })

  it("does not attach an Authorization header when there is no auth cookie", async () => {
    await fetchProductDetailPageData("p-1")

    expect(capturedProductAuthHeader).toBeNull()
  })

  it("attaches the bearer token from the cookie once /api/users/me confirms the user", async () => {
    setAuthCookie("token-abc")

    await fetchProductDetailPageData("p-1")

    expect(capturedMeAuthHeader).toBe("Bearer token-abc")
    expect(capturedProductAuthHeader).toBe("Bearer token-abc")
  })

  it("drops the Authorization header when /api/users/me reports the user is gone", async () => {
    setAuthCookie("stale-token")
    server.use(http.get("*/api/users/me", () => HttpResponse.json({ message: "User not found" })))

    await fetchProductDetailPageData("p-1")

    expect(capturedProductAuthHeader).toBeNull()
  })

  it("treats questions as optional: a questions failure still resolves with questions: null", async () => {
    server.use(http.get("*/api/product-questions/product/:id", () => new HttpResponse(null, { status: 500 })))

    const result = await fetchProductDetailPageData("p-1")

    expect(result.productData).toEqual(mockWithUserProducts)
    expect(result.questions).toBeNull()
  })

  it("throws a friendly 'not found' message on a 404 product response", async () => {
    server.use(
      http.get("*/api/products/:id/with-user-products", () =>
        HttpResponse.json({ message: "not found" }, { status: 404 }),
      ),
    )

    await expect(fetchProductDetailPageData("missing")).rejects.toThrow(
      "Product not found. The product may have been removed or doesn't exist.",
    )
  })

  it("throws a friendly permission message on a 403 product response", async () => {
    server.use(
      http.get("*/api/products/:id/with-user-products", () =>
        HttpResponse.json({ message: "forbidden" }, { status: 403 }),
      ),
    )

    await expect(fetchProductDetailPageData("p-1")).rejects.toThrow(
      "You don't have permission to view this product. Please log in and try again.",
    )
  })

  it("throws a friendly auth message on a 401 product response", async () => {
    server.use(
      http.get("*/api/products/:id/with-user-products", () =>
        HttpResponse.json({ message: "unauthorized" }, { status: 401 }),
      ),
    )

    await expect(fetchProductDetailPageData("p-1")).rejects.toThrow(
      "Authentication required. Please log in to view this product.",
    )
  })

  it("throws a friendly server error message on a 500 product response", async () => {
    server.use(http.get("*/api/products/:id/with-user-products", () => new HttpResponse(null, { status: 500 })))

    await expect(fetchProductDetailPageData("p-1")).rejects.toThrow("Server error occurred. Please try again later.")
  })

  it("throws a generic connection error when the request itself fails (network failure)", async () => {
    server.use(http.get("*/api/products/:id/with-user-products", () => HttpResponse.error()))

    await expect(fetchProductDetailPageData("p-1")).rejects.toThrow(
      "Unable to connect to server. Please check your internet connection.",
    )
  })

  it("throws when the product payload is missing the 'product' field", async () => {
    server.use(http.get("*/api/products/:id/with-user-products", () => HttpResponse.json({ userProducts: [] })))

    await expect(fetchProductDetailPageData("p-1")).rejects.toThrow("Invalid product data received from server")
  })

  it("throws when the product field is null", async () => {
    server.use(http.get("*/api/products/:id/with-user-products", () => HttpResponse.json({ product: null })))

    await expect(fetchProductDetailPageData("p-1")).rejects.toThrow("Invalid product data received from server")
  })
})

describe("fetchProductReviews contract", () => {
  it("returns the reviews response and requests page=0 size=10 by default", async () => {
    const result = await fetchProductReviews("p-1")

    expect(result).toEqual(mockReviewsResponse)
    expect(capturedReviewsQuery?.get("page")).toBe("0")
    expect(capturedReviewsQuery?.get("size")).toBe("10")
    expect(capturedReviewsQuery?.has("userProductId")).toBe(false)
  })

  it("includes userProductId in the query when given", async () => {
    await fetchProductReviews("p-1", "up-2")

    expect(capturedReviewsQuery?.get("userProductId")).toBe("up-2")
  })

  it("tolerates an empty content array", async () => {
    server.use(
      http.get("*/api/reviews/product/:productId", () => HttpResponse.json({ ...mockReviewsResponse, content: [] })),
    )

    const result = await fetchProductReviews("p-1")
    expect(result?.content).toEqual([])
  })

  it("resolves to null (never throws) when the reviews request fails", async () => {
    server.use(http.get("*/api/reviews/product/:productId", () => new HttpResponse(null, { status: 500 })))

    await expect(fetchProductReviews("p-1")).resolves.toBeNull()
  })

  it("resolves to null on a 404", async () => {
    server.use(http.get("*/api/reviews/product/:productId", () => new HttpResponse(null, { status: 404 })))

    await expect(fetchProductReviews("p-1")).resolves.toBeNull()
  })

  it("resolves to null on network failure", async () => {
    server.use(http.get("*/api/reviews/product/:productId", () => HttpResponse.error()))

    await expect(fetchProductReviews("p-1")).resolves.toBeNull()
  })
})
