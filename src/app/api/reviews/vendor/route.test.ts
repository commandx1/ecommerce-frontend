import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/reviews/vendor`
const payload = { content: [{ id: "rev-1", productName: "Composite Kit", rating: 4 }], totalElements: 1 }

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("GET /api/reviews/vendor", () => {
  it("forwards the Authorization header and returns the backend payload", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    const response = await GET(routeRequest("/api/reviews/vendor", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(captured.authorization).toBe(AUTH)
  })

  it("accepts the auth-storage cookie as the credential source", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    await GET(routeRequest("/api/reviews/vendor", { cookie: authCookie("cookie-token") }))

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("answers 401 without calling the backend when there is no credential at all", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    const response = await GET(routeRequest("/api/reviews/vendor"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it.each([401, 403, 404, 500])("forwards the backend error payload and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "denied" }, { status })))

    const response = await GET(routeRequest("/api/reviews/vendor", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "denied" })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("gateway", { status: 502 })))

    const response = await GET(routeRequest("/api/reviews/vendor", { authorization: AUTH }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Failed to fetch vendor reviews" })
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/reviews/vendor", { authorization: AUTH }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Internal server error" })
  })

  it("answers 500 — not 200 — when a successful response carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/reviews/vendor", { authorization: AUTH }))

    // Unlike its siblings this route never checks content-type, so `response.json()` throws
    // and the catch-all turns an empty 204 into a 500.
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Internal server error" })
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
