import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeParams, routeRequest } from "@/test/route-harness"
import { DELETE, GET, PUT } from "./route"

/**
 * Product detail records (the attribute sheet). Reads are public; writes require a token.
 */

const ANY = `${BACKEND}/api/products/details/*`
const details = { id: "d-1", productId: "p-1", attributes: [{ name: "Shade", value: "A2" }] }

describe("GET /api/products/details/[id]", () => {
  it("is public: it returns the record with no Authorization header at all", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(details)
      }),
    )

    const response = await GET(routeRequest("/api/products/details/d-1"), routeParams({ id: "d-1" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(details)
    expect(captured.url).toBe(`${BACKEND}/api/products/details/d-1`)
    expect(captured.authorization).toBeNull()
  })

  it("drops the caller's token instead of forwarding it", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(details)
      }),
    )

    await GET(routeRequest("/api/products/details/d-1", { authorization: AUTH }), routeParams({ id: "d-1" }))

    expect(captured.authorization).toBeNull()
  })

  it("forwards a 404 for a record that does not exist", async () => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "not found" }, { status: 404 })))

    const response = await GET(routeRequest("/api/products/details/missing"), routeParams({ id: "missing" }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ message: "not found" })
  })

  it("describes a non-JSON error with the upstream status", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("gateway", { status: 502 })))

    const response = await GET(routeRequest("/api/products/details/d-1"), routeParams({ id: "d-1" }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Request failed with status 502", status: 502 })
  })

  it("answers 500 when a 2xx carries no JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/products/details/d-1"), routeParams({ id: "d-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Invalid response from server" })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/details/d-1"), routeParams({ id: "d-1" }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("encodes the id before building the upstream path, so a `../` segment cannot escape /api/products/details (K8)", async () => {
    const captured = createCapture()
    server.use(
      http.get(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(details)
      }),
    )

    await GET(routeRequest("/api/products/details/x"), routeParams({ id: "../users/me" }))

    expect(captured.url).toBe(`${BACKEND}/api/products/details/..%2Fusers%2Fme`)
  })
})

describe("PUT /api/products/details/[id]", () => {
  it("forwards the Authorization header and the JSON body", async () => {
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
      jsonRequest("/api/products/details/d-1", { attributes: [] }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "d-1" }),
    )

    expect(response.status).toBe(200)
    expect(captured.authorization).toBe(AUTH)
    expect(body).toEqual({ attributes: [] })
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
      jsonRequest("/api/products/details/d-1", { attributes: [] }, { method: "PUT" }),
      routeParams({ id: "d-1" }),
    )

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("checks auth BEFORE reading the body, so an anonymous bad payload is still a 401 (Y10)", async () => {
    const response = await PUT(
      routeRequest("/api/products/details/d-1", { method: "PUT", body: "not-json" }),
      routeParams({ id: "d-1" }),
    )

    expect(response.status).toBe(401)
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.put(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await PUT(
      jsonRequest("/api/products/details/d-1", {}, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "d-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("forwards a validation error from the backend", async () => {
    server.use(http.put(ANY, () => HttpResponse.json({ message: "invalid attribute" }, { status: 400 })))

    const response = await PUT(
      jsonRequest("/api/products/details/d-1", {}, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "d-1" }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "invalid attribute" })
  })
})

describe("DELETE /api/products/details/[id]", () => {
  it("answers a success envelope on 204", async () => {
    const captured = createCapture()
    server.use(
      http.delete(ANY, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(
      routeRequest("/api/products/details/d-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "d-1" }),
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
      routeRequest("/api/products/details/d-1", { method: "DELETE" }),
      routeParams({ id: "d-1" }),
    )

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it.each([403, 404, 500])("forwards the backend error and status %i", async (status) => {
    server.use(http.delete(ANY, () => HttpResponse.json({ message: "cannot delete" }, { status })))

    const response = await DELETE(
      routeRequest("/api/products/details/d-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "d-1" }),
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "cannot delete" })
  })
})

describe("/api/products/details/[id] route surface", () => {
  it("exposes GET, PUT and DELETE only", async () => {
    const route = await import("./route")

    expect(Object.keys(route).sort()).toEqual(["DELETE", "GET", "PUT"])
  })
})
