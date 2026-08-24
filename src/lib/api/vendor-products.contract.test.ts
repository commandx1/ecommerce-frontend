import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { ApiRequestError } from "./request"
import { fetchUserProductStats } from "./vendor-products"

const mockStats = {
  totalProducts: 120,
  activeProducts: 100,
  inactiveProducts: 20,
  outOfStockProducts: 5,
  lowStockProducts: 8,
}

// `fetchUserProductStats` accepts a Next.js router instance in its params but never calls it
// (`void params.router` in the source) - a minimal stub is enough to satisfy the type.
const routerStub = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

let capturedAuthHeader: string | null = null

beforeEach(() => {
  capturedAuthHeader = null

  server.use(
    http.get("*/api/user-products/stats", ({ request }) => {
      capturedAuthHeader = request.headers.get("Authorization")
      return HttpResponse.json(mockStats)
    }),
  )
})

describe("fetchUserProductStats contract", () => {
  it("returns the typed product stats on a happy path", async () => {
    const stats = await fetchUserProductStats({ accessToken: "token-1", router: routerStub as never })

    expect(stats).toEqual(mockStats)
    expect(typeof stats.totalProducts).toBe("number")
  })

  it("sends the bearer token from params, not the client interceptor's cookie token", async () => {
    await fetchUserProductStats({ accessToken: "explicit-token", router: routerStub as never })

    expect(capturedAuthHeader).toBe("Bearer explicit-token")
  })

  it("tolerates a brand-new vendor with all-zero stats", async () => {
    server.use(
      http.get("*/api/user-products/stats", () =>
        HttpResponse.json({
          totalProducts: 0,
          activeProducts: 0,
          inactiveProducts: 0,
          outOfStockProducts: 0,
          lowStockProducts: 0,
        }),
      ),
    )

    const stats = await fetchUserProductStats({ accessToken: "token-1", router: routerStub as never })

    expect(stats.totalProducts).toBe(0)
  })

  it("rejects with a 401 and marks the error auth-handled", async () => {
    server.use(
      http.get("*/api/user-products/stats", () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })),
    )

    const error = await fetchUserProductStats({ accessToken: "expired", router: routerStub as never }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects with a 403 without marking the error auth-handled", async () => {
    server.use(
      http.get("*/api/user-products/stats", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })),
    )

    const error = await fetchUserProductStats({ accessToken: "token-1", router: routerStub as never }).catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.authHandled).toBe(false)
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.get("*/api/user-products/stats", () => HttpResponse.json({ message: "Server error" }, { status: 500 })),
    )

    await expect(fetchUserProductStats({ accessToken: "token-1", router: routerStub as never })).rejects.toMatchObject({
      status: 500,
    })
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/api/user-products/stats", () => HttpResponse.error()))

    await expect(fetchUserProductStats({ accessToken: "token-1", router: routerStub as never })).rejects.toBeInstanceOf(
      ApiRequestError,
    )
  })
})
