import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeRequest } from "@/test/route-harness"
import { POST } from "./route"

/** Bulk price change across several of the vendor's offers — money-touching, so auth matters. */

const UPSTREAM = `${BACKEND}/api/user-products/bulk-discount`
const payload = { userProductIds: ["up-1", "up-2"], discountPercentage: 15 }

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("POST /api/user-products/bulk-discount", () => {
  it("forwards the Authorization header and the discount payload untouched", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json([{ id: "up-1" }, { id: "up-2" }])
      }),
    )

    const response = await POST(jsonRequest("/api/user-products/bulk-discount", payload, { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([{ id: "up-1" }, { id: "up-2" }])
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toBe("application/json")
    // No client-side clamping of the percentage: whatever the caller sends reaches the backend.
    expect(body).toEqual(payload)
  })

  it("forwards an out-of-range discount unchanged — validation is the backend's job", async () => {
    let body: unknown = null
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ message: "invalid discount" }, { status: 400 })
      }),
    )

    const response = await POST(
      jsonRequest(
        "/api/user-products/bulk-discount",
        { userProductIds: ["up-1"], discountPercentage: 500 },
        { authorization: AUTH },
      ),
    )

    expect(body).toEqual({ userProductIds: ["up-1"], discountPercentage: 500 })
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "invalid discount" })
  })

  it("accepts the auth-storage cookie as the credential source", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json([])
      }),
    )

    await POST(jsonRequest("/api/user-products/bulk-discount", payload, { cookie: authCookie("cookie-token") }))

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("answers 401 without calling the backend when there is no credential", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json([])
      }),
    )

    const response = await POST(jsonRequest("/api/user-products/bulk-discount", payload))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("checks auth BEFORE reading the body, so an anonymous bad payload is still a 401", async () => {
    const response = await POST(routeRequest("/api/user-products/bulk-discount", { method: "POST", body: "not-json" }))

    // Contrast with /api/products/details and /api/user-products/[id], which answer 500 here.
    expect(response.status).toBe(401)
  })

  it.each([403, 409, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.post(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await POST(jsonRequest("/api/user-products/bulk-discount", payload, { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await POST(jsonRequest("/api/user-products/bulk-discount", payload, { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.error()))

    const response = await POST(jsonRequest("/api/user-products/bulk-discount", payload, { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["POST"])
  })
})
