import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * The vendor product table's filter endpoint. It rebuilds the query string parameter by
 * parameter, so which values are forwarded, defaulted or dropped is the contract.
 */

const UPSTREAM = `${BACKEND}/api/user-products/filter`
const page = { content: [{ id: "up-1" }], totalElements: 1, totalPages: 1, page: 0, size: 10 }

describe("GET /api/user-products/filter", () => {
  it("requires `type` and answers 400 without it", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(routeRequest("/api/user-products/filter", { authorization: AUTH }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Type parameter is required" })
    expect(captured.count).toBe(0)
  })

  it("answers 401 before validating `type` when unauthenticated", async () => {
    const response = await GET(routeRequest("/api/user-products/filter"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
  })

  it("sends the required parameters with their defaults", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(routeRequest("/api/user-products/filter?type=ACTIVE", { authorization: AUTH }))

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("type")).toBe("ACTIVE")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("10")
    expect(url.searchParams.get("howManySoldDay")).toBe("0")
    expect([...url.searchParams.keys()].sort()).toEqual(["howManySoldDay", "page", "size", "type"])
  })

  it("forwards every optional filter when provided", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(
      routeRequest(
        "/api/user-products/filter?type=ACTIVE&price=false&stock=true&search=kit&brand=MARK3&sortBy=price&sortDir=asc&userProductId=up-9&howManySoldDay=30&page=2&size=50",
        { authorization: AUTH },
      ),
    )

    const url = new URL(captured.url ?? "")
    expect(Object.fromEntries(url.searchParams)).toEqual({
      type: "ACTIVE",
      page: "2",
      size: "50",
      howManySoldDay: "30",
      price: "false",
      stock: "true",
      search: "kit",
      brand: "MARK3",
      sortBy: "price",
      sortDir: "asc",
      userProductId: "up-9",
    })
  })

  it("keeps an explicitly empty `price`/`stock` but drops empty text filters", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(
      routeRequest(
        "/api/user-products/filter?type=ACTIVE&price=&stock=&search=&brand=&sortBy=&sortDir=&userProductId=",
        {
          authorization: AUTH,
        },
      ),
    )

    const url = new URL(captured.url ?? "")
    // `price`/`stock` are checked with `!== null`, the text filters also with `!== ""` — pinned
    // because the asymmetry decides whether the backend sees a blank filter or none at all.
    expect(url.searchParams.get("price")).toBe("")
    expect(url.searchParams.get("stock")).toBe("")
    expect(url.searchParams.has("search")).toBe(false)
    expect(url.searchParams.has("brand")).toBe(false)
    expect(url.searchParams.has("sortBy")).toBe(false)
    expect(url.searchParams.has("sortDir")).toBe(false)
    expect(url.searchParams.has("userProductId")).toBe(false)
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
      routeRequest(`/api/user-products/filter?type=ACTIVE&search=${encodeURIComponent("a&size=999")}`, {
        authorization: AUTH,
      }),
    )

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("search")).toBe("a&size=999")
    expect(url.searchParams.get("size")).toBe("10")
  })

  it("returns the backend page on success", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json(page)))

    const response = await GET(routeRequest("/api/user-products/filter?type=ACTIVE", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)
  })

  it.each([400, 403, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/user-products/filter?type=ACTIVE", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("returns an empty page when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/user-products/filter?type=ACTIVE", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 0 })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/user-products/filter?type=ACTIVE", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
