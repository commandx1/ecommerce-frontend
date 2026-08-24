import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeParams, routeRequest } from "@/test/route-harness"
import { DELETE, GET, PUT } from "./route"

/** Same detail record as `/api/products/details/:id`, addressed by product id instead. */

const ANY = `${BACKEND}/api/products/details/by-product/*`
const details = { id: "d-1", productId: "p-1" }

describe("GET /api/products/details/by-product/[productId]", () => {
  it("is public and addresses the record by product id", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(details)
      }),
    )

    const response = await GET(routeRequest("/api/products/details/by-product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(details)
    expect(captured.url).toBe(`${BACKEND}/api/products/details/by-product/p-1`)
    expect(captured.authorization).toBeNull()
  })

  it("forwards a 404 for a product with no detail record", async () => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "no details" }, { status: 404 })))

    const response = await GET(routeRequest("/api/products/details/by-product/p-9"), routeParams({ productId: "p-9" }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ message: "no details" })
  })

  it("answers 500 when a 2xx carries no JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/products/details/by-product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Invalid response from server" })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/details/by-product/p-1"), routeParams({ productId: "p-1" }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("encodes the productId before building the upstream path, so a `../` segment cannot escape /api/products/details/by-product (K8)", async () => {
    const captured = createCapture()
    server.use(
      http.get(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(details)
      }),
    )

    await GET(routeRequest("/api/products/details/by-product/x"), routeParams({ productId: "../users/me" }))

    expect(captured.url).toBe(`${BACKEND}/api/products/details/by-product/..%2Fusers%2Fme`)
  })
})

describe("PUT /api/products/details/by-product/[productId]", () => {
  it("forwards the Authorization header and the body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.put(ANY, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json(details)
      }),
    )

    const response = await PUT(
      jsonRequest("/api/products/details/by-product/p-1", { shade: "A2" }, { method: "PUT", authorization: AUTH }),
      routeParams({ productId: "p-1" }),
    )

    expect(response.status).toBe(200)
    expect(captured.authorization).toBe(AUTH)
    expect(body).toEqual({ shade: "A2" })
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.put(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(details)
      }),
    )

    const response = await PUT(
      jsonRequest("/api/products/details/by-product/p-1", {}, { method: "PUT" }),
      routeParams({ productId: "p-1" }),
    )

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("checks auth BEFORE reading the body, so an anonymous bad payload is still a 401 (Y10)", async () => {
    const response = await PUT(
      routeRequest("/api/products/details/by-product/p-1", { method: "PUT", body: "not-json" }),
      routeParams({ productId: "p-1" }),
    )

    expect(response.status).toBe(401)
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.put(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await PUT(
      jsonRequest("/api/products/details/by-product/p-1", {}, { method: "PUT", authorization: AUTH }),
      routeParams({ productId: "p-1" }),
    )

    await expect(response.json()).resolves.toEqual({ success: true })
  })
})

describe("DELETE /api/products/details/by-product/[productId]", () => {
  it("answers a success envelope and forwards the token", async () => {
    const captured = createCapture()
    server.use(
      http.delete(ANY, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(
      routeRequest("/api/products/details/by-product/p-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ productId: "p-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
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

    const response = await DELETE(
      routeRequest("/api/products/details/by-product/p-1", { method: "DELETE" }),
      routeParams({ productId: "p-1" }),
    )

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("forwards a 403 from the backend", async () => {
    server.use(http.delete(ANY, () => HttpResponse.json({ message: "not yours" }, { status: 403 })))

    const response = await DELETE(
      routeRequest("/api/products/details/by-product/p-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ productId: "p-1" }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ message: "not yours" })
  })
})

describe("/api/products/details/by-product/[productId] route surface", () => {
  it("exposes GET, PUT and DELETE only", async () => {
    const route = await import("./route")

    expect(Object.keys(route).sort()).toEqual(["DELETE", "GET", "PUT"])
  })
})
