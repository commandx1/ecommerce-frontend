import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeParams, routeRequest } from "@/test/route-harness"
import { DELETE, GET, PUT } from "./route"

const ANY = `${BACKEND}/api/user-products/*`
const userProduct = { id: "up-1", productId: "p-1", price: 10, stock: 5 }

describe("GET /api/user-products/[id]", () => {
  it("forwards the id and the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(userProduct)
      }),
    )

    const response = await GET(
      routeRequest("/api/user-products/up-1", { authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(userProduct)
    expect(captured.url).toBe(`${BACKEND}/api/user-products/up-1`)
    expect(captured.authorization).toBe(AUTH)
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(userProduct)
      }),
    )

    const response = await GET(routeRequest("/api/user-products/up-1"), routeParams({ id: "up-1" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("does not accept the auth-storage cookie, unlike the collection route", async () => {
    const cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: "t" } }))}`

    const response = await GET(routeRequest("/api/user-products/up-1", { cookie }), routeParams({ id: "up-1" }))

    expect(response.status).toBe(401)
  })

  it("encodes the id before interpolating it into the upstream path, so `../` cannot traverse", async () => {
    const captured = createCapture()
    server.use(
      http.get(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    await GET(routeRequest("/api/user-products/x", { authorization: AUTH }), routeParams({ id: "../users/me" }))

    // FIXED (K8): `encodeURIComponent(id)` keeps the segment literal.
    expect(captured.url).toBe(`${BACKEND}/api/user-products/..%2Fusers%2Fme`)
  })

  it.each([403, 404, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(
      routeRequest("/api/user-products/up-1", { authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(
      routeRequest("/api/user-products/up-1", { authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    // Pinned oddity: a GET that yields no JSON answers `{ success: true }` instead of a 404/500.
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(
      routeRequest("/api/user-products/up-1", { authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })
})

describe("PUT /api/user-products/[id]", () => {
  it("forwards the Authorization header and the JSON body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.put(ANY, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json({ ...userProduct, price: 12 })
      }),
    )

    const response = await PUT(
      jsonRequest("/api/user-products/up-1", { price: 12 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ...userProduct, price: 12 })
    expect(captured.authorization).toBe(AUTH)
    expect(body).toEqual({ price: 12 })
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.put(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(userProduct)
      }),
    )

    const response = await PUT(
      jsonRequest("/api/user-products/up-1", { price: 12 }, { method: "PUT" }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("checks auth BEFORE parsing the body, so a bad body from an anonymous caller is a 401", async () => {
    const captured = createCapture()
    server.use(
      http.put(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(userProduct)
      }),
    )

    const response = await PUT(
      routeRequest("/api/user-products/up-1", { method: "PUT", body: "not-json" }),
      routeParams({ id: "up-1" }),
    )

    // FIXED (Y10): auth is now checked before `request.json()`, so an unauthenticated request
    // with a malformed body answers 401 instead of a 500 from the JSON parse failure.
    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("still answers 500 for an authenticated caller with a malformed body", async () => {
    const response = await PUT(
      routeRequest("/api/user-products/up-1", { method: "PUT", authorization: AUTH, body: "not-json" }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(500)
  })

  it("forwards a validation error from the backend", async () => {
    server.use(http.put(ANY, () => HttpResponse.json({ message: "price must be positive" }, { status: 400 })))

    const response = await PUT(
      jsonRequest("/api/user-products/up-1", { price: -1 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "price must be positive" })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.put(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await PUT(
      jsonRequest("/api/user-products/up-1", { price: 12 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("encodes the id before interpolating it into the upstream PUT path, so `../` cannot traverse", async () => {
    const captured = createCapture()
    server.use(
      http.put(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    await PUT(
      jsonRequest("/api/user-products/x", { price: 1 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "../users/me" }),
    )

    expect(captured.url).toBe(`${BACKEND}/api/user-products/..%2Fusers%2Fme`)
  })
})

describe("DELETE /api/user-products/[id]", () => {
  it("answers a success envelope and forwards the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.delete(ANY, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(
      routeRequest("/api/user-products/up-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(captured.url).toBe(`${BACKEND}/api/user-products/up-1`)
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
      routeRequest("/api/user-products/up-1", { method: "DELETE" }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it.each([403, 404, 409])("forwards the backend error and status %i", async (status) => {
    server.use(http.delete(ANY, () => HttpResponse.json({ message: "cannot delete" }, { status })))

    const response = await DELETE(
      routeRequest("/api/user-products/up-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "up-1" }),
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "cannot delete" })
  })
})

describe("/api/user-products/[id] route surface", () => {
  it("exposes GET, PUT and DELETE only", async () => {
    const route = await import("./route")

    expect(Object.keys(route).sort()).toEqual(["DELETE", "GET", "PUT"])
  })
})
