import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * Vendor inventory counters. The route prefers the backend's own `/stats` endpoint, but it will
 * (a) fall back to the filter endpoint on 403 and (b) recompute the numbers itself whenever the
 * payload is not already a stats object. The arithmetic below IS the contract — low stock is
 * `0 < stock < 20`.
 */

const STATS = `${BACKEND}/api/user-products/stats`
const FILTER = `${BACKEND}/api/user-products/filter`

const inventory = [
  { id: "1", active: true, stock: 0 },
  { id: "2", active: true, stock: 5 },
  { id: "3", active: true, stock: 19 },
  { id: "4", active: true, stock: 20 },
  { id: "5", active: false, stock: 100 },
]

const expectedStats = {
  totalProducts: 5,
  activeProducts: 4,
  inactiveProducts: 1,
  outOfStockProducts: 1,
  lowStockProducts: 2,
}

describe("GET /api/user-products/stats", () => {
  it("returns the backend stats object untouched when it is already complete", async () => {
    const captured = createCapture()
    const backendStats = {
      totalProducts: 9,
      activeProducts: 8,
      inactiveProducts: 1,
      outOfStockProducts: 2,
      lowStockProducts: 3,
    }
    server.use(
      http.get(STATS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(backendStats)
      }),
    )

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(backendStats)
    expect(captured.authorization).toBe(AUTH)
  })

  it("recomputes the counters when the backend answers with a product list instead", async () => {
    server.use(http.get(STATS, () => HttpResponse.json({ content: inventory })))

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual(expectedStats)
  })

  it("treats a stats object missing a single field as a list and recomputes to zeros", async () => {
    server.use(
      http.get(STATS, () =>
        HttpResponse.json({ totalProducts: 9, activeProducts: 8, inactiveProducts: 1, outOfStockProducts: 2 }),
      ),
    )

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))

    // Pinned, not endorsed: a partial payload silently becomes "vendor has zero products"
    // rather than an error.
    await expect(response.json()).resolves.toEqual({
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      outOfStockProducts: 0,
      lowStockProducts: 0,
    })
  })

  it("falls back to the filter endpoint on 403 and computes the stats from it", async () => {
    const captured = createCapture()
    server.use(
      http.get(STATS, () => new HttpResponse(null, { status: 403 })),
      http.get(FILTER, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ content: inventory })
      }),
    )

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(expectedStats)

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("type")).toBe("TOTAL")
    expect(url.searchParams.get("size")).toBe("1000")
  })

  it("unwraps a nested data.content payload from the fallback", async () => {
    server.use(
      http.get(STATS, () => new HttpResponse(null, { status: 403 })),
      http.get(FILTER, () => HttpResponse.json({ data: { content: inventory } })),
    )

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual(expectedStats)
  })

  it("surfaces the fallback's failure when it also fails", async () => {
    server.use(
      http.get(STATS, () => new HttpResponse(null, { status: 403 })),
      http.get(FILTER, () => HttpResponse.json({ message: "still forbidden" }, { status: 403 })),
    )

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ message: "still forbidden" })
  })

  it("answers 401 without calling the backend when there is no credential", async () => {
    const captured = createCapture()
    server.use(
      http.get(STATS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    const response = await GET(routeRequest("/api/user-products/stats"))

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("returns zeroed stats when a 2xx carries no JSON", async () => {
    server.use(http.get(STATS, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      outOfStockProducts: 0,
      lowStockProducts: 0,
    })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(STATS, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/user-products/stats", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
