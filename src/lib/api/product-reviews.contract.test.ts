import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import type { ReviewsResponse } from "@/features/products/product-detail/types"
import { server } from "@/mocks/server"
import { createReview, deleteReview, fetchReviewsByProduct, updateReview } from "./product-reviews"
import { ApiRequestError } from "./request"

function makeReviewsResponse(overrides: Partial<ReviewsResponse> = {}): ReviewsResponse {
  return {
    content: [
      {
        id: "review-1",
        productId: "p-1",
        userProductId: "up-1",
        vendorDisplayName: "Acme Dental",
        star: 4,
        userId: "u-1",
        username: "jdoe",
        title: "Great product",
        comment: "Works as expected",
        createdDate: "2026-01-10T09:00:00Z",
        peopleFoundHelpful: 3,
        helpfulTrue: true,
      },
    ],
    pageable: {
      pageNumber: 0,
      pageSize: 10,
      sort: { empty: true, unsorted: true, sorted: false },
      offset: 0,
      paged: true,
      unpaged: false,
    },
    last: true,
    totalPages: 1,
    totalElements: 1,
    size: 10,
    number: 0,
    sort: { empty: true, unsorted: true, sorted: false },
    numberOfElements: 1,
    first: true,
    empty: false,
    ...overrides,
  }
}

let capturedQuery: URLSearchParams | null = null
let capturedCreateBody: Record<string, unknown> | null = null
let capturedCreateHeaders: Headers | null = null
let capturedUpdateBody: Record<string, unknown> | null = null
let capturedUpdateHeaders: Headers | null = null
let capturedDeleteHeaders: Headers | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedQuery = null
  capturedCreateBody = null
  capturedCreateHeaders = null
  capturedUpdateBody = null
  capturedUpdateHeaders = null
  capturedDeleteHeaders = null

  server.use(
    http.get("*/api/reviews/product/:productId", ({ request }) => {
      capturedQuery = new URL(request.url).searchParams
      return HttpResponse.json(makeReviewsResponse())
    }),
    http.post("*/api/reviews", async ({ request }) => {
      capturedCreateBody = (await request.json()) as Record<string, unknown>
      capturedCreateHeaders = request.headers
      return new HttpResponse(null, { status: 200 })
    }),
    http.put("*/api/reviews/:id", async ({ request }) => {
      capturedUpdateBody = (await request.json()) as Record<string, unknown>
      capturedUpdateHeaders = request.headers
      return new HttpResponse(null, { status: 200 })
    }),
    http.delete("*/api/reviews/:id", ({ request }) => {
      capturedDeleteHeaders = request.headers
      return new HttpResponse(null, { status: 204 })
    }),
  )
})

describe("fetchReviewsByProduct contract", () => {
  it("defaults page/size and omits userProductId when not given", async () => {
    const response = await fetchReviewsByProduct({ productId: "p-1" })

    expect(capturedQuery?.get("page")).toBe("0")
    expect(capturedQuery?.get("size")).toBe("10")
    expect(capturedQuery?.has("userProductId")).toBe(false)

    expect(response.content).toHaveLength(1)
    expect(response.content[0]?.star).toBe(4)
    expect(response.totalElements).toBe(1)
    expect(typeof response.first).toBe("boolean")
  })

  it("serializes page, size and userProductId when given", async () => {
    await fetchReviewsByProduct({ productId: "p-1", userProductId: "up-2", page: 2, size: 5 })

    expect(capturedQuery?.get("page")).toBe("2")
    expect(capturedQuery?.get("size")).toBe("5")
    expect(capturedQuery?.get("userProductId")).toBe("up-2")
  })

  it("tolerates an empty content array", async () => {
    server.use(
      http.get("*/api/reviews/product/:productId", () => HttpResponse.json(makeReviewsResponse({ content: [] }))),
    )

    const response = await fetchReviewsByProduct({ productId: "p-1" })
    expect(response.content).toEqual([])
  })

  it("rejects on 404 when the product has no reviews endpoint", async () => {
    server.use(
      http.get("*/api/reviews/product/:productId", () =>
        HttpResponse.json({ message: "Product not found" }, { status: 404 }),
      ),
    )

    await expect(fetchReviewsByProduct({ productId: "missing" })).rejects.toThrow("Product not found")
  })

  it("rejects on network failure", async () => {
    server.use(http.get("*/api/reviews/product/:productId", () => HttpResponse.error()))

    await expect(fetchReviewsByProduct({ productId: "p-1" })).rejects.toThrow()
  })
})

describe("createReview contract", () => {
  it("sends the exact create payload shape and bearer token", async () => {
    await createReview({
      accessToken: "token-1",
      productId: "p-1",
      userProductId: "up-1",
      star: 5,
      title: "Excellent",
      comment: "Would buy again",
    })

    expect(capturedCreateBody).toEqual({
      productId: "p-1",
      userProductId: "up-1",
      star: 5,
      title: "Excellent",
      comment: "Would buy again",
    })
    expect(capturedCreateHeaders?.get("authorization")).toBe("Bearer token-1")
  })

  it("omits the Authorization header when accessToken is null", async () => {
    await createReview({
      accessToken: null,
      productId: "p-1",
      userProductId: "up-1",
      star: 3,
      title: "OK",
      comment: "Fine",
    })

    expect(capturedCreateHeaders?.get("authorization")).toBeNull()
  })

  it("surfaces authHandled on a 401 response", async () => {
    server.use(http.post("*/api/reviews", () => HttpResponse.json({ message: "Session expired" }, { status: 401 })))

    const error = await createReview({
      accessToken: "token-1",
      productId: "p-1",
      userProductId: "up-1",
      star: 5,
      title: "t",
      comment: "c",
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(401)
    expect((error as ApiRequestError).authHandled).toBe(true)
  })

  it("rejects on 400 validation error", async () => {
    server.use(http.post("*/api/reviews", () => HttpResponse.json({ message: "Star must be 1-5" }, { status: 400 })))

    await expect(
      createReview({ accessToken: "t", productId: "p-1", userProductId: "up-1", star: 0, title: "t", comment: "c" }),
    ).rejects.toThrow("Star must be 1-5")
  })

  it("rejects on 500", async () => {
    server.use(http.post("*/api/reviews", () => new HttpResponse(null, { status: 500 })))

    await expect(
      createReview({ accessToken: "t", productId: "p-1", userProductId: "up-1", star: 5, title: "t", comment: "c" }),
    ).rejects.toThrow("Failed to submit review")
  })
})

describe("updateReview contract", () => {
  it("sends only star/title/comment, not reviewId, and the bearer token", async () => {
    await updateReview({ accessToken: "token-2", reviewId: "review-1", star: 2, title: "Meh", comment: "Not great" })

    expect(capturedUpdateBody).toEqual({ star: 2, title: "Meh", comment: "Not great" })
    expect(capturedUpdateHeaders?.get("authorization")).toBe("Bearer token-2")
  })

  it("rejects with a 403 when editing someone else's review", async () => {
    server.use(http.put("*/api/reviews/:id", () => HttpResponse.json({ message: "Not your review" }, { status: 403 })))

    const error = await updateReview({
      accessToken: "token-2",
      reviewId: "review-1",
      star: 2,
      title: "t",
      comment: "c",
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(403)
    expect((error as ApiRequestError).authHandled).toBe(false)
    expect((error as ApiRequestError).message).toBe("Not your review")
  })

  it("rejects on 404 when the review no longer exists", async () => {
    server.use(http.put("*/api/reviews/:id", () => HttpResponse.json({ message: "Review not found" }, { status: 404 })))

    await expect(
      updateReview({ accessToken: "t", reviewId: "gone", star: 1, title: "t", comment: "c" }),
    ).rejects.toThrow("Review not found")
  })
})

describe("deleteReview contract", () => {
  it("sends the bearer token and resolves on success", async () => {
    await expect(deleteReview({ accessToken: "token-3", reviewId: "review-1" })).resolves.toBeUndefined()
    expect(capturedDeleteHeaders?.get("authorization")).toBe("Bearer token-3")
  })

  it("omits the Authorization header when accessToken is null", async () => {
    await deleteReview({ accessToken: null, reviewId: "review-1" })
    expect(capturedDeleteHeaders?.get("authorization")).toBeNull()
  })

  it("rejects with a 403 when deleting someone else's review", async () => {
    server.use(
      http.delete("*/api/reviews/:id", () => HttpResponse.json({ message: "Not your review" }, { status: 403 })),
    )

    const error = await deleteReview({ accessToken: "token-3", reviewId: "review-1" }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(403)
    expect((error as ApiRequestError).authHandled).toBe(false)
  })

  it("rejects on network failure", async () => {
    server.use(http.delete("*/api/reviews/:id", () => HttpResponse.error()))

    await expect(deleteReview({ accessToken: "t", reviewId: "review-1" })).rejects.toThrow()
  })
})
