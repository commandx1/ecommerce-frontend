import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/products/brands/search`
const page = { content: ["MARK3"], totalElements: 1, totalPages: 1 }

describe("GET /api/products/brands/search", () => {
  it("forwards the typeahead term and pagination", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(
      routeRequest("/api/products/brands/search?search=mar&page=1&size=5", { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("search")).toBe("mar")
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

    await GET(routeRequest("/api/products/brands/search", { authorization: AUTH }))

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("search")).toBe("")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("20")
  })

  it("url-encodes a term with reserved characters", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(
      routeRequest(`/api/products/brands/search?search=${encodeURIComponent("3M & Co")}`, { authorization: AUTH }),
    )

    expect(new URL(captured.url ?? "").searchParams.get("search")).toBe("3M & Co")
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(routeRequest("/api/products/brands/search?search=mar"))

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it.each([400, 403, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/products/brands/search", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("returns an empty page when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/products/brands/search", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ content: [], totalElements: 0, totalPages: 0 })
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/brands/search", { authorization: AUTH }))

    expect(response.status).toBe(500)
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
