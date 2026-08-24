import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeParams, routeRequest } from "@/test/route-harness"
import { DELETE, GET, PUT } from "./route"

/**
 * `/api/products/:id` is the one product route that goes through axios (`proxyRequest`) instead
 * of `serverRequest`, with `validateStatus: () => true` — so every status arrives as a resolved
 * response and the handler decides. These tests pin that translation.
 */

const ANY = `${BACKEND}/api/products/*`
const product = { id: "p-1", name: "Composite Kit" }

describe("GET /api/products/[id]", () => {
  it("forwards the Authorization header and returns the product", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await GET(routeRequest("/api/products/p-1", { authorization: AUTH }), routeParams({ id: "p-1" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(product)
    expect(captured.url).toBe(`${BACKEND}/api/products/p-1`)
    expect(captured.authorization).toBe(AUTH)
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await GET(routeRequest("/api/products/p-1"), routeParams({ id: "p-1" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("does not accept the auth-storage cookie as a credential", async () => {
    const cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: "t" } }))}`

    const response = await GET(routeRequest("/api/products/p-1", { cookie }), routeParams({ id: "p-1" }))

    expect(response.status).toBe(401)
  })

  it("encodes the id before building the upstream path, so a `../` segment cannot escape /api/products (K8)", async () => {
    const captured = createCapture()
    server.use(
      http.get(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    await GET(routeRequest("/api/products/x", { authorization: AUTH }), routeParams({ id: "../users/me" }))

    // Next decodes the dynamic segment before handing it to the handler, so the id can contain
    // raw slashes; proxyRequest now re-encodes it, keeping the traversal attempt inside one
    // opaque path segment instead of letting fetch/axios normalize it away to another endpoint.
    expect(captured.url).toBe(`${BACKEND}/api/products/..%2Fusers%2Fme`)
  })

  it.each([400, 403, 404, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "Product not found" }, { status })))

    const response = await GET(routeRequest("/api/products/p-1", { authorization: AUTH }), routeParams({ id: "p-1" }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "Product not found" })
  })

  it("wraps a non-JSON error body in a message envelope", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("upstream exploded", { status: 502 })))

    const response = await GET(routeRequest("/api/products/p-1", { authorization: AUTH }), routeParams({ id: "p-1" }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "upstream exploded", status: 502 })
  })

  it("answers 500 when a 2xx does not carry JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("plain text", { status: 200 })))

    const response = await GET(routeRequest("/api/products/p-1", { authorization: AUTH }), routeParams({ id: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Invalid response from server" })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/p-1", { authorization: AUTH }), routeParams({ id: "p-1" }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
    expect(Object.keys(body)).toEqual(["message"])
  })
})

describe("PUT /api/products/[id]", () => {
  it("sends the JSON body with a JSON content type and the Authorization header", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.put(ANY, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json({ ...product, name: "Renamed" })
      }),
    )

    const response = await PUT(
      jsonRequest("/api/products/p-1", { name: "Renamed" }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: "p-1", name: "Renamed" })
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toContain("application/json")
    expect(body).toEqual({ name: "Renamed" })
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.put(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await PUT(
      jsonRequest("/api/products/p-1", { name: "Renamed" }, { method: "PUT" }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("returns a success envelope when the update answers 2xx without JSON", async () => {
    server.use(http.put(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await PUT(
      jsonRequest("/api/products/p-1", { name: "Renamed" }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("forwards a validation error from the backend", async () => {
    server.use(http.put(ANY, () => HttpResponse.json({ message: "name is required" }, { status: 400 })))

    const response = await PUT(
      jsonRequest("/api/products/p-1", {}, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "name is required" })
  })

  it("answers 500 when the request body is not JSON", async () => {
    const response = await PUT(
      routeRequest("/api/products/p-1", { method: "PUT", authorization: AUTH, body: "not-json" }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(500)
  })
})

describe("DELETE /api/products/[id]", () => {
  it("answers a success envelope and forwards the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.delete(ANY, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(
      routeRequest("/api/products/p-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(captured.url).toBe(`${BACKEND}/api/products/p-1`)
    expect(captured.authorization).toBe(AUTH)
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.delete(ANY, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(routeRequest("/api/products/p-1", { method: "DELETE" }), routeParams({ id: "p-1" }))

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it.each([403, 404, 409])("forwards the backend error and status %i", async (status) => {
    server.use(http.delete(ANY, () => HttpResponse.json({ message: "cannot delete" }, { status })))

    const response = await DELETE(
      routeRequest("/api/products/p-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "cannot delete" })
  })
})

describe("/api/products/[id] route surface", () => {
  it("exposes GET, PUT and DELETE only", async () => {
    const route = await import("./route")

    expect(Object.keys(route).sort()).toEqual(["DELETE", "GET", "PUT"])
  })
})
