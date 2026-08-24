import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeParams, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * Barcode lookup used by the vendor "add product" flow. Note the backend path is
 * `/api/barcode/products/ByBarcode/:barcode` — camel case upstream, lower case on the route —
 * so the exact upstream URL is asserted, not just the status.
 */

const upstream = (barcode: string) => `${BACKEND}/api/barcode/products/ByBarcode/${barcode}`
const ANY = `${BACKEND}/api/barcode/products/ByBarcode/*`
const product = { id: "bp-1", barcode: "0123456789012", title: "Composite Kit" }

const call = (barcode: string, init: { authorization?: string } = { authorization: AUTH }) =>
  GET(routeRequest(`/api/barcode/products/bybarcode/${barcode}`, init), routeParams({ barcode }))

describe("GET /api/barcode/products/bybarcode/[barcode]", () => {
  it("forwards the barcode to the camel-cased backend path with the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await call("0123456789012")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(product)
    expect(captured.url).toBe(upstream("0123456789012"))
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("accept")).toBe("application/json")
  })

  it("url-encodes a barcode containing path separators and spaces", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    await call("a/b c?d")

    // Path traversal / query injection through the barcode segment is not possible.
    expect(captured.url).toBe(upstream("a%2Fb%20c%3Fd"))
  })

  it("trims surrounding whitespace before forwarding", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    await GET(
      routeRequest("/api/barcode/products/bybarcode/0123", { authorization: AUTH }),
      routeParams({ barcode: "  0123 " }),
    )

    expect(captured.url).toBe(upstream("0123"))
  })

  it("answers 401 without calling the backend when the Authorization header is missing", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await call("0123456789012", {})

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("answers 400 for a blank barcode", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await GET(
      routeRequest("/api/barcode/products/bybarcode/%20", { authorization: AUTH }),
      routeParams({ barcode: "   " }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Barcode parameter is required" })
    expect(captured.count).toBe(0)
  })

  it("propagates a 404 as a 404 — a missing barcode is never an empty 200", async () => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "Barcode not found" }, { status: 404 })))

    const response = await call("0000000000000")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ message: "Barcode not found", status: 404 })
  })

  it("merges the backend error payload into the response body alongside message/status", async () => {
    server.use(
      http.get(ANY, () => HttpResponse.json({ message: "Rejected", code: "BARCODE_BLOCKED" }, { status: 400 })),
    )

    const response = await call("0123456789012")

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Rejected", status: 400, code: "BARCODE_BLOCKED" })
  })

  it("still answers 200 when the backend returns an empty JSON body for a found-but-empty record", async () => {
    server.use(http.get(ANY, () => HttpResponse.json(null)))

    const response = await call("0123456789012")

    // The 404-vs-empty-200 distinction lives entirely with the backend; the route forwards it.
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toBeNull()
  })

  it("reports a JSON error body it cannot parse instead of throwing", async () => {
    server.use(
      http.get(ANY, () =>
        HttpResponse.text("<html>gateway error</html>", {
          status: 502,
          headers: { "content-type": "application/json" },
        }),
      ),
    )

    const response = await call("0123456789012")

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      message: "Backend request failed with status 502. Could not parse error response.",
      status: 502,
    })
  })

  it("reports a non-JSON error body with the upstream status", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("Bad gateway", { status: 502 })))

    const response = await call("0123456789012")

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      message: "Backend request failed with status 502. No error details available.",
      status: 502,
    })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await call("0123456789012")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await call("0123456789012")
    const body = (await response.json()) as { message: string; status: number }

    expect(response.status).toBe(500)
    expect(body.status).toBe(500)
    expect(body.message).not.toContain("at ")
    expect(Object.keys(body).sort()).toEqual(["message", "status"])
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
