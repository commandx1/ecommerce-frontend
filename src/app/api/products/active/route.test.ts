import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/products/active`
const page = { content: [{ id: "p-1" }], totalElements: 1, totalPages: 1 }

describe("GET /api/products/active", () => {
  it("forwards search, brand and pagination and returns the page", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(
      routeRequest("/api/products/active?search=composite&brand=MARK3&page=2&size=50", { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("search")).toBe("composite")
    expect(url.searchParams.get("brand")).toBe("MARK3")
    expect(url.searchParams.get("page")).toBe("2")
    expect(url.searchParams.get("size")).toBe("50")
    expect(captured.authorization).toBe(AUTH)
  })

  it("defaults to an empty search on page 0 with size 10", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(routeRequest("/api/products/active", { authorization: AUTH }))

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("search")).toBe("")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("10")
    expect(url.searchParams.has("brand")).toBe(false)
  })

  it("url-encodes a search term with reserved characters instead of injecting parameters", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(
      routeRequest(`/api/products/active?search=${encodeURIComponent("a&size=999#x")}`, { authorization: AUTH }),
    )

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("search")).toBe("a&size=999#x")
    expect(url.searchParams.get("size")).toBe("10")
  })

  it("drops an empty brand filter", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(routeRequest("/api/products/active?brand=", { authorization: AUTH }))

    expect(new URL(captured.url ?? "").searchParams.has("brand")).toBe(false)
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(routeRequest("/api/products/active?search=x"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it.each([400, 403, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/products/active", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("describes a non-JSON error with the upstream status", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("gateway", { status: 502 })))

    const response = await GET(routeRequest("/api/products/active", { authorization: AUTH }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Request failed with status 502", status: 502 })
  })

  it("returns an empty page when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/products/active", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ content: [], totalElements: 0, totalPages: 0 })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/active", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
