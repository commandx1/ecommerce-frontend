import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeRequest } from "@/test/route-harness"
import { POST } from "./route"

const UPSTREAM = `${BACKEND}/api/products/details`
const details = { id: "d-1", productId: "p-1" }

describe("POST /api/products/details", () => {
  it("forwards the Authorization header and the JSON body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json(details)
      }),
    )

    const response = await POST(
      jsonRequest("/api/products/details", { productId: "p-1", shade: "A2" }, { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(details)
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toBe("application/json")
    expect(body).toEqual({ productId: "p-1", shade: "A2" })
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(details)
      }),
    )

    const response = await POST(jsonRequest("/api/products/details", { productId: "p-1" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("checks auth BEFORE reading the body, so an anonymous bad payload is still a 401 (Y10)", async () => {
    const response = await POST(routeRequest("/api/products/details", { method: "POST", body: "not-json" }))

    expect(response.status).toBe(401)
  })

  it.each([400, 403, 409, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.post(UPSTREAM, () => HttpResponse.json({ message: "rejected" }, { status })))

    const response = await POST(jsonRequest("/api/products/details", { productId: "p-1" }, { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "rejected" })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.text("", { status: 201 })))

    const response = await POST(jsonRequest("/api/products/details", { productId: "p-1" }, { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.error()))

    const response = await POST(jsonRequest("/api/products/details", { productId: "p-1" }, { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["POST"])
  })
})
