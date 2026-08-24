import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/products/public-search`
const page = { content: [{ id: "p-1" }], totalElements: 1, totalPages: 1 }

describe("GET /api/products/public-search", () => {
  it("renames the lowercase `search` param to the backend's capitalised `Search`", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(routeRequest("/api/products/public-search?search=composite&page=1&size=5"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("Search")).toBe("composite")
    expect(url.searchParams.has("search")).toBe(false)
    expect(url.searchParams.get("page")).toBe("1")
    expect(url.searchParams.get("size")).toBe("5")
  })

  it("defaults to an empty term on page 0 with size 20", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(routeRequest("/api/products/public-search"))

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("Search")).toBe("")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("20")
  })

  it("stays public: no Authorization header is required or forwarded", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(routeRequest("/api/products/public-search?search=x", { authorization: "Bearer t" }))

    expect(response.status).toBe(200)
    // The caller's token is intentionally dropped — this endpoint must return the same catalog
    // for everyone.
    expect(captured.authorization).toBeNull()
  })

  it("url-encodes a term with reserved characters", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(routeRequest(`/api/products/public-search?search=${encodeURIComponent("a&size=999")}`))

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("Search")).toBe("a&size=999")
    expect(url.searchParams.get("size")).toBe("20")
  })

  it.each([400, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/products/public-search?search=x"))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("returns an empty page when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/products/public-search?search=x"))

    await expect(response.json()).resolves.toEqual({ content: [], totalElements: 0, totalPages: 0 })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/public-search?search=x"))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
