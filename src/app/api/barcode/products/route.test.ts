import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/barcode/products`
const products = [{ id: "bp-1", barcode: "0123456789012" }]

describe("GET /api/barcode/products", () => {
  it("forwards the Authorization header and returns the backend list", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(products)
      }),
    )

    const response = await GET(routeRequest("/api/barcode/products", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(products)
    expect(captured.url).toBe(UPSTREAM)
    expect(captured.authorization).toBe(AUTH)
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(products)
      }),
    )

    const response = await GET(routeRequest("/api/barcode/products"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("drops any query string instead of forwarding it", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(products)
      }),
    )

    await GET(routeRequest("/api/barcode/products?page=3&size=50", { authorization: AUTH }))

    // Pinned: this endpoint is unpaginated upstream, so pagination params are silently ignored.
    expect(captured.url).toBe(UPSTREAM)
  })

  it.each([400, 401, 403, 404, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/barcode/products", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("describes a non-JSON error with the upstream status", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("Bad gateway", { status: 502 })))

    const response = await GET(routeRequest("/api/barcode/products", { authorization: AUTH }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Request failed with status 502", status: 502 })
  })

  it("returns an empty list when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/barcode/products", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/barcode/products", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(Object.keys(body)).toEqual(["message"])
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
