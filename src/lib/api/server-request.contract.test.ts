import { HttpResponse, http } from "msw"
import { afterEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"

/**
 * `serverRequest` is the Route Handler side of the API layer: it bypasses the `/backend-api`
 * rewrite and talks to `BACKEND_URL` directly. `BACKEND_URL` is read once at module load, so
 * every test that needs a different value re-imports the module after stubbing the env.
 */
async function importServerRequest() {
  vi.resetModules()
  const module = await import("./server-request")
  return module.serverRequest
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("serverRequest contract", () => {
  it("targets http://localhost:8081 (ecommerce-api) when BACKEND_URL is unset", async () => {
    let capturedUrl: string | null = null
    server.use(
      http.get("http://localhost:8081/api/orders/buyer", ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ orders: [], totalElements: 0 })
      }),
    )

    const serverRequest = await importServerRequest()
    const response = await serverRequest("/api/orders/buyer")

    // Fixed (Y2): the ecommerce-api runs on :8081 locally (:8080 is dt-admin-api). The default
    // here is only reached when BACKEND_URL is missing, but it used to point at the wrong service.
    expect(capturedUrl).toBe("http://localhost:8081/api/orders/buyer")
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ orders: [], totalElements: 0 })
  })

  it("concatenates BACKEND_URL and the path verbatim, without adding a slash", async () => {
    vi.stubEnv("BACKEND_URL", "http://api.example.test")
    let capturedUrl: string | null = null
    server.use(
      http.get("http://api.example.test/api/cart", ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ cartId: "cart-1", cartItems: [] })
      }),
    )

    const serverRequest = await importServerRequest()
    await serverRequest("/api/cart")

    expect(capturedUrl).toBe("http://api.example.test/api/cart")
  })

  it("forwards method, headers, body and query string untouched", async () => {
    vi.stubEnv("BACKEND_URL", "http://api.example.test")
    let capturedAuth: string | null = null
    let capturedBody: unknown = null
    let capturedQuery: string | null = null

    server.use(
      http.post("http://api.example.test/api/cart/items", async ({ request }) => {
        capturedAuth = request.headers.get("Authorization")
        capturedQuery = new URL(request.url).searchParams.get("force")
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 201 })
      }),
    )

    const serverRequest = await importServerRequest()
    const response = await serverRequest("/api/cart/items?force=true", {
      method: "POST",
      headers: { Authorization: "Bearer token-123", "Content-Type": "application/json" },
      body: JSON.stringify({ userProductId: "up-1", quantity: 2, autoOrder: null }),
    })

    expect(response.status).toBe(201)
    expect(capturedAuth).toBe("Bearer token-123")
    expect(capturedQuery).toBe("true")
    expect(capturedBody).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: null })
  })

  it("resolves with the error response instead of throwing on 4xx/5xx", async () => {
    vi.stubEnv("BACKEND_URL", "http://api.example.test")
    server.use(
      http.get("http://api.example.test/api/boom", () =>
        HttpResponse.json({ message: "Internal server error" }, { status: 500 }),
      ),
    )

    const serverRequest = await importServerRequest()
    const response = await serverRequest("/api/boom")

    // fetch only rejects on a transport failure, so route handlers must branch on `response.ok`.
    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Internal server error" })
  })

  it("rejects when the transport itself fails", async () => {
    vi.stubEnv("BACKEND_URL", "http://api.example.test")
    server.use(http.get("http://api.example.test/api/offline", () => HttpResponse.error()))

    const serverRequest = await importServerRequest()

    await expect(serverRequest("/api/offline")).rejects.toThrow()
  })
})
