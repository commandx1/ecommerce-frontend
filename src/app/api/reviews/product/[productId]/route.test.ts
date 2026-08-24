import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeParams, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * Public review list for a product — rendered during SSR, so the token may only exist in the
 * `auth-storage` cookie. This route uses `getAuthorizationHeader`, which accepts either.
 */

const ANY = `${BACKEND}/api/reviews/product/*`
const reviews = { content: [{ id: "rev-1", rating: 5 }], totalElements: 1 }

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("GET /api/reviews/product/[productId]", () => {
  it("defaults to page 0 / size 10 and forwards the product id", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    const response = await GET(routeRequest("/api/reviews/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(reviews)

    const url = new URL(captured.url ?? "")
    expect(url.pathname).toBe("/api/reviews/product/p-1")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("10")
    expect(url.searchParams.has("userProductId")).toBe(false)
  })

  it("forwards pagination and the optional userProductId filter", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    await GET(
      routeRequest("/api/reviews/product/p-1?page=2&size=25&userProductId=up-9"),
      routeParams({ productId: "p-1" }),
    )

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("page")).toBe("2")
    expect(url.searchParams.get("size")).toBe("25")
    expect(url.searchParams.get("userProductId")).toBe("up-9")
  })

  it("drops an empty userProductId instead of forwarding a blank filter", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    await GET(routeRequest("/api/reviews/product/p-1?userProductId="), routeParams({ productId: "p-1" }))

    expect(new URL(captured.url ?? "").searchParams.has("userProductId")).toBe(false)
  })

  it("forwards an explicit Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    await GET(routeRequest("/api/reviews/product/p-1", { authorization: AUTH }), routeParams({ productId: "p-1" }))

    expect(captured.authorization).toBe(AUTH)
  })

  it("derives the Bearer token from the auth-storage cookie during SSR", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    await GET(
      routeRequest("/api/reviews/product/p-1", { cookie: authCookie("cookie-token") }),
      routeParams({ productId: "p-1" }),
    )

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("stays anonymous — and successful — when there is no session at all", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    const response = await GET(routeRequest("/api/reviews/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(200)
    expect(captured.authorization).toBeNull()
  })

  it("asks the backend for fresh data on every render", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    await GET(routeRequest("/api/reviews/product/p-1"), routeParams({ productId: "p-1" }))
    await GET(routeRequest("/api/reviews/product/p-1"), routeParams({ productId: "p-1" }))

    expect(captured.count).toBe(2)
  })

  it("encodes the productId before interpolating it into the upstream path, so `../` cannot traverse", async () => {
    const captured = createCapture()
    server.use(
      http.get(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(reviews)
      }),
    )

    await GET(routeRequest("/api/reviews/product/x"), routeParams({ productId: "../users/me" }))

    // FIXED (K8): the segment is encoded before being templated into the upstream path.
    expect(captured.url).toContain("/api/reviews/product/..%2Fusers%2Fme")
    expect(captured.url).not.toContain("/api/users/me")
  })

  it.each([400, 401, 403, 404, 500])("forwards the backend error payload and status %i", async (status) => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "no reviews" }, { status })))

    const response = await GET(routeRequest("/api/reviews/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "no reviews" })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("<html>500</html>", { status: 500 })))

    const response = await GET(routeRequest("/api/reviews/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Failed to fetch reviews" })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/reviews/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Internal server error" })
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
