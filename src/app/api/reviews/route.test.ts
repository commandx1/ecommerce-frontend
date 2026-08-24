import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeRequest } from "@/test/route-harness"
import { POST } from "./route"

/**
 * Review creation. Unlike the vendor routes, this handler does NOT require an Authorization
 * header — it forwards one if present and otherwise calls the backend anonymously. The
 * "unauthenticated -> 401" contract lives in the backend only; pinned below.
 */

const UPSTREAM = `${BACKEND}/api/reviews`
const review = { id: "rev-1", rating: 5, comment: "Great" }

describe("POST /api/reviews", () => {
  it("forwards the Authorization header and the review body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json(review)
      }),
    )

    const response = await POST(
      jsonRequest("/api/reviews", { productId: "p-1", rating: 5, comment: "Great" }, { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(review)
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toBe("application/json")
    expect(body).toEqual({ productId: "p-1", rating: 5, comment: "Great" })
  })

  it("still calls the backend when no Authorization header is present", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(review)
      }),
    )

    const response = await POST(jsonRequest("/api/reviews", { productId: "p-1", rating: 5 }))

    // Pinned, not endorsed: the BFF does not gate anonymous review creation.
    expect(captured.count).toBe(1)
    expect(captured.authorization).toBeNull()
    expect(response.status).toBe(200)
  })

  it.each([400, 401, 403, 409, 500])("forwards the backend error payload and status %i", async (status) => {
    server.use(http.post(UPSTREAM, () => HttpResponse.json({ message: "Already reviewed" }, { status })))

    const response = await POST(jsonRequest("/api/reviews", { productId: "p-1" }, { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "Already reviewed" })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.text("<html>502</html>", { status: 502 })))

    const response = await POST(jsonRequest("/api/reviews", { productId: "p-1" }, { authorization: AUTH }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Failed to create review" })
  })

  it("answers 500 without a stack trace when the request body is not JSON", async () => {
    const response = await POST(routeRequest("/api/reviews", { method: "POST", body: "not-json" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.error()))

    const response = await POST(jsonRequest("/api/reviews", { productId: "p-1" }, { authorization: AUTH }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("exposes POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["POST"])
  })
})
