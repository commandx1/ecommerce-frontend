import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { BACKEND, createCapture, record } from "@/test/route-harness"

/**
 * The product detail page's server entry point. It wraps `fetchProductDetailPageData` /
 * `fetchProductReviews` in React's `cache()`, so these tests cover both the caching wrapper and
 * the fetch/error contract underneath it — including how the token is read from the cookie jar
 * during SSR and which failures are fatal for the page.
 */

const cookieStore = { value: null as string | null }

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "auth-storage" && cookieStore.value ? { name, value: cookieStore.value } : undefined,
  }),
}))

const ME = `${BACKEND}/api/users/me`
const PRODUCT = `${BACKEND}/api/products/*`
const QUESTIONS = `${BACKEND}/api/product-questions/product/*`
const REVIEWS = `${BACKEND}/api/reviews/product/*`

const productPayload = { product: { id: "p-1", name: "Composite Kit" }, userProducts: [{ id: "up-1" }] }
const questionsPayload = { content: [{ id: "q-1" }], totalElements: 1 }
const reviewsPayload = { content: [{ id: "rev-1" }], totalElements: 1 }

const authStorage = (token: string) => encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))

async function importModule() {
  vi.resetModules()
  return import("./get-product-detail-page-data")
}

function stubHappyPath() {
  server.use(
    http.get(ME, () => HttpResponse.json({ id: "user-1", email: "buyer@example.com" })),
    http.get(QUESTIONS, () => HttpResponse.json(questionsPayload)),
    http.get(REVIEWS, () => HttpResponse.json(reviewsPayload)),
    http.get(PRODUCT, () => HttpResponse.json(productPayload)),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  cookieStore.value = null
})

describe("getProductDetailPageData — anonymous SSR", () => {
  it("returns the product payload with questions and sends no Authorization header", async () => {
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(PRODUCT, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPayload)
      }),
    )

    const { getProductDetailPageData } = await importModule()
    const data = await getProductDetailPageData("p-1")

    expect(data.productData).toEqual(productPayload)
    expect(data.questions).toEqual(questionsPayload)
    expect(captured.url).toBe(`${BACKEND}/api/products/p-1/with-user-products`)
    expect(captured.authorization).toBeNull()
  })

  it("does not call /users/me when there is no session cookie", async () => {
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(ME, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    const { getProductDetailPageData } = await importModule()
    await getProductDetailPageData("p-1")

    expect(captured.count).toBe(0)
  })
})

describe("getProductDetailPageData — authenticated SSR", () => {
  it("reads the token from the auth-storage cookie and forwards it downstream", async () => {
    cookieStore.value = authStorage("cookie-token")
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(PRODUCT, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPayload)
      }),
    )

    const { getProductDetailPageData } = await importModule()
    await getProductDetailPageData("p-1")

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("accepts a plain (not percent-encoded) auth-storage cookie too", async () => {
    cookieStore.value = JSON.stringify({ state: { accessToken: "plain-token" } })
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(PRODUCT, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPayload)
      }),
    )

    const { getProductDetailPageData } = await importModule()
    await getProductDetailPageData("p-1")

    expect(captured.authorization).toBe("Bearer plain-token")
  })

  it("drops the token when /users/me reports the user does not exist", async () => {
    cookieStore.value = authStorage("stale-token")
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(ME, () => HttpResponse.json({ message: "User not found" }, { status: 404 })),
      http.get(PRODUCT, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPayload)
      }),
    )

    const { getProductDetailPageData } = await importModule()
    const data = await getProductDetailPageData("p-1")

    // A stale cookie must not turn a public product page into a 401.
    expect(captured.authorization).toBeNull()
    expect(data.productData).toEqual(productPayload)
  })

  it("keeps the token when /users/me itself fails for an unrelated reason", async () => {
    cookieStore.value = authStorage("cookie-token")
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(ME, () => HttpResponse.json({ message: "Internal server error" }, { status: 500 })),
      http.get(PRODUCT, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPayload)
      }),
    )

    const { getProductDetailPageData } = await importModule()
    await getProductDetailPageData("p-1")

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("ignores a corrupt auth-storage cookie instead of throwing", async () => {
    cookieStore.value = "not-json"
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(PRODUCT, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPayload)
      }),
    )

    const { getProductDetailPageData } = await importModule()
    await expect(getProductDetailPageData("p-1")).resolves.toBeTruthy()
    expect(captured.authorization).toBeNull()
  })
})

describe("getProductDetailPageData — partial failure", () => {
  it("still renders the page when the questions call fails", async () => {
    stubHappyPath()
    server.use(http.get(QUESTIONS, () => HttpResponse.json({ message: "boom" }, { status: 500 })))

    const { getProductDetailPageData } = await importModule()
    const data = await getProductDetailPageData("p-1")

    // Questions are explicitly optional: they degrade to `null`, the page survives.
    expect(data.questions).toBeNull()
    expect(data.productData).toEqual(productPayload)
  })

  it.each([
    [403, "You don't have permission to view this product. Please log in and try again."],
    [404, "Product not found. The product may have been removed or doesn't exist."],
    [401, "Authentication required. Please log in to view this product."],
    [500, "Server error occurred. Please try again later."],
  ])("throws user-facing copy for an upstream %i", async (status, message) => {
    stubHappyPath()
    server.use(http.get(PRODUCT, () => HttpResponse.json({ message: "raw backend detail" }, { status })))

    const { getProductDetailPageData } = await importModule()

    // The product fetch is fatal: unlike questions there is no fallback, so the page throws and
    // the route's error/not-found boundary takes over.
    await expect(getProductDetailPageData("p-1")).rejects.toThrow(message)
  })

  it("passes an unmapped backend message through for other 4xx statuses", async () => {
    stubHappyPath()
    server.use(http.get(PRODUCT, () => HttpResponse.json({ message: "Product is archived" }, { status: 410 })))

    const { getProductDetailPageData } = await importModule()

    await expect(getProductDetailPageData("p-1")).rejects.toThrow("Product is archived")
  })

  it("uses a generic message when a 4xx carries no usable detail", async () => {
    stubHappyPath()
    server.use(http.get(PRODUCT, () => HttpResponse.json({ message: "Failed to fetch product" }, { status: 418 })))

    const { getProductDetailPageData } = await importModule()

    await expect(getProductDetailPageData("p-1")).rejects.toThrow("Unable to load product (Error 418).")
  })

  it("throws a connection error — not a stack trace — when the backend is unreachable", async () => {
    stubHappyPath()
    server.use(http.get(PRODUCT, () => HttpResponse.error()))

    const { getProductDetailPageData } = await importModule()

    await expect(getProductDetailPageData("p-1")).rejects.toThrow(
      "Unable to connect to server. Please check your internet connection.",
    )
  })

  it("rejects a 200 whose payload has no `product` key", async () => {
    stubHappyPath()
    server.use(http.get(PRODUCT, () => HttpResponse.json({ userProducts: [] })))

    const { getProductDetailPageData } = await importModule()

    await expect(getProductDetailPageData("p-1")).rejects.toThrow("Invalid product data received from server")
  })
})

describe("getProductReviews", () => {
  it("requests the first page of reviews and returns them", async () => {
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(REVIEWS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviewsPayload)
      }),
    )

    const { getProductReviews } = await importModule()
    const reviews = await getProductReviews("p-1")

    expect(reviews).toEqual(reviewsPayload)
    const url = new URL(captured.url ?? "")
    expect(url.pathname).toBe("/api/reviews/product/p-1")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("10")
    expect(url.searchParams.has("userProductId")).toBe(false)
  })

  it("adds the vendor filter when a userProductId is given", async () => {
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(REVIEWS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviewsPayload)
      }),
    )

    const { getProductReviews } = await importModule()
    await getProductReviews("p-1", "up-9")

    expect(new URL(captured.url ?? "").searchParams.get("userProductId")).toBe("up-9")
  })

  it.each([401, 404, 500])("degrades to null instead of failing the page on a %i", async (status) => {
    stubHappyPath()
    server.use(http.get(REVIEWS, () => HttpResponse.json({ message: "boom" }, { status })))

    const { getProductReviews } = await importModule()

    await expect(getProductReviews("p-1")).resolves.toBeNull()
  })

  it("degrades to null when the backend is unreachable", async () => {
    stubHappyPath()
    server.use(http.get(REVIEWS, () => HttpResponse.error()))

    const { getProductReviews } = await importModule()

    await expect(getProductReviews("p-1")).resolves.toBeNull()
  })
})

describe("React cache() wrapper", () => {
  it("does not deduplicate outside a React request scope — every call hits the backend", async () => {
    const captured = createCapture()
    stubHappyPath()
    server.use(
      http.get(PRODUCT, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPayload)
      }),
    )

    const { getProductDetailPageData } = await importModule()
    await getProductDetailPageData("p-1")
    await getProductDetailPageData("p-1")

    // Pinned so the split with production behaviour stays visible: during a real render React's
    // cache dedupes these two calls (that is why `generateMetadata` can reuse the page fetch);
    // outside a render — here, and in any non-React server code that imports this module — it
    // does not, and the backend sees both requests.
    expect(captured.count).toBe(2)
  })
})
