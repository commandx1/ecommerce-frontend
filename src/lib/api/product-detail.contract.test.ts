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
let capturedProductPath: string | null = null
let capturedQuestionsQuery: URLSearchParams | null = null
let capturedQuestionsPath: string | null = null
let capturedReviewsQuery: URLSearchParams | null = null
let capturedReviewsPath: string | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. Registered per test because the global setup resets handlers after every test case.
 */
beforeEach(() => {
  setAuthCookie(null)
  capturedMeAuthHeader = undefined
  capturedProductAuthHeader = undefined
  capturedProductPath = null
  capturedQuestionsQuery = null
  capturedQuestionsPath = null
  capturedReviewsQuery = null
  capturedReviewsPath = null

  server.use(
    http.get("*/api/users/me", ({ request }) => {
      capturedMeAuthHeader = request.headers.get("authorization")
      return HttpResponse.json({})
    }),
    http.get("*/api/products/:id/with-user-products", ({ request }) => {
      capturedProductAuthHeader = request.headers.get("authorization")
      capturedProductPath = new URL(request.url).pathname
      return HttpResponse.json(mockWithUserProducts)
    }),
    http.get("*/api/product-questions/product/:id", ({ request }) => {
      capturedQuestionsQuery = new URL(request.url).searchParams
      capturedQuestionsPath = new URL(request.url).pathname
      return HttpResponse.json(mockQuestionsResponse)
    }),
    http.get("*/api/reviews/product/:productId", ({ request }) => {
      capturedReviewsQuery = new URL(request.url).searchParams
      capturedReviewsPath = new URL(request.url).pathname
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

  // The `id` comes straight from the `[id]` route param with no server-side validation, so it is
  // percent-encoded before being spliced into the backend path - otherwise a value containing "/"
  // could add extra path segments (e.g. break out to a sibling route) instead of being sent as a
  // single opaque id.
  it("percent-encodes an id containing a slash instead of splicing it in as extra path segments", async () => {
    const trickyId = "p/../admin 1"

    await fetchProductDetailPageData(trickyId)

    expect(capturedProductPath).toBe(`/api/products/${encodeURIComponent(trickyId)}/with-user-products`)
    expect(capturedQuestionsPath).toBe(`/api/product-questions/product/${encodeURIComponent(trickyId)}`)
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

  // Backend: ProductServiceImpl.getProductWithUserProducts (line ~758-771) throws
  // ProductNotFoundException, which extends RuntimeException directly - not
  // ResourceNotFoundException. GlobalExceptionHandler's trailing
  // @ExceptionHandler(RuntimeException.class) catch-all maps it to 400, so the real "missing
  // product" response is 400 with a "Product not found. ID: ..." message, never 404.
  it("throws a friendly 'not found' message on the real 400 product-not-found response (not 404)", async () => {
    server.use(
      http.get("*/api/products/:id/with-user-products", () =>
        HttpResponse.json({ message: "Product not found. ID: missing" }, { status: 400 }),
      ),
    )

    await expect(fetchProductDetailPageData("missing")).rejects.toThrow(
      "Product not found. The product may have been removed or doesn't exist.",
    )
  })

  // A generic 400 (not the "product not found" shape above) still surfaces the raw backend
  // message rather than the friendly "not found" copy - only the specific not-found message
  // pattern above is special-cased.
  it("surfaces the raw backend message on a generic 400 that isn't the not-found shape", async () => {
    server.use(
      http.get("*/api/products/:id/with-user-products", () =>
        HttpResponse.json({ message: "Some other validation error" }, { status: 400 }),
      ),
    )

    await expect(fetchProductDetailPageData("p-1")).rejects.toThrow("Some other validation error")
  })

  // GET /api/products/{id}/with-user-products never throws ForbiddenException - authentication is
  // fully optional on this endpoint (ProductServiceImpl.getProductWithUserProducts falls back to
  // an unauthenticated response instead of rejecting; see the "🔽 JWT YOK" branch at line ~789).
  // A 403 from this endpoint is not producible by the real backend/frontend flow, so no test
  // pins that fictional response shape.

  // Backend: JwtAuthenticationFilter.doFilterInternal (line ~66-73) returns 401 with
  // {"error":"UserNotFound","message":"User does not exist anymore."} when the JWT's user has
  // been deleted from the DB - this is the one real 401 path reachable on this optional-auth
  // endpoint (an invalid-but-parseable token otherwise just falls back to unauthenticated access,
  // not 401).
  it("throws a friendly auth message on a 401 product response (deleted-user JWT)", async () => {
    server.use(
      http.get("*/api/products/:id/with-user-products", () =>
        HttpResponse.json({ error: "UserNotFound", message: "User does not exist anymore." }, { status: 401 }),
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

  it("percent-encodes an id containing a slash instead of splicing it in as extra path segments", async () => {
    const trickyId = "p/../admin 1"

    await fetchProductReviews(trickyId)

    expect(capturedReviewsPath).toBe(`/api/reviews/product/${encodeURIComponent(trickyId)}`)
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
