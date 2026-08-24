import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/barcode/products/search`
const payload = { products: [{ id: "p-1" }], barcodeProducts: [{ id: "bp-1" }] }

describe("GET /api/barcode/products/search", () => {
  it("forwards the title query and the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    const response = await GET(routeRequest("/api/barcode/products/search?title=composite", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(new URL(captured.url ?? "").searchParams.get("title")).toBe("composite")
    expect(captured.authorization).toBe(AUTH)
  })

  it("url-encodes a title with spaces, ampersands and unicode", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    await GET(
      routeRequest(`/api/barcode/products/search?title=${encodeURIComponent("kompozit & ölçü #2")}`, {
        authorization: AUTH,
      }),
    )

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("title")).toBe("kompozit & ölçü #2")
    // The extra value must not have introduced a second parameter.
    expect([...url.searchParams.keys()]).toEqual(["title"])
  })

  it("answers 401 before validating the title when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    const response = await GET(routeRequest("/api/barcode/products/search"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it.each([
    ["a missing title", "/api/barcode/products/search"],
    ["an empty title", "/api/barcode/products/search?title="],
  ])("answers 400 for %s", async (_label, path) => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    const response = await GET(routeRequest(path, { authorization: AUTH }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Title parameter is required" })
    expect(captured.count).toBe(0)
  })

  it.each([400, 403, 404, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/barcode/products/search?title=x", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("returns the empty search shape when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/barcode/products/search?title=x", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ products: [], barcodeProducts: [] })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/barcode/products/search?title=x", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
