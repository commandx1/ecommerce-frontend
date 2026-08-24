import axios from "axios"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { ApiRequestError, apiRequest } from "./request"

/**
 * `apiRequest` is the shared wrapper every typed API module funnels through, so these tests pin
 * the two things callers depend on: which axios instance a `client` target resolves to, and how
 * an arbitrary failure is normalised into an `ApiRequestError`.
 *
 * The "backend" client carries the `/backend-api` baseURL; the "app" client has none, so its URLs
 * resolve against the jsdom origin. Both patterns are matched with a `*` host wildcard.
 */
describe("apiRequest client resolution", () => {
  it("prefixes the backend client with the /backend-api baseURL", async () => {
    let capturedUrl: string | null = null
    server.use(
      http.get("*/backend-api/contract/ping", ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ ok: true, count: 3 })
      }),
    )

    const data = await apiRequest.requestJson<{ ok: boolean; count: number }>({
      client: "backend",
      method: "GET",
      url: "/contract/ping",
    })

    expect(capturedUrl).toContain("/backend-api/contract/ping")
    expect(data).toEqual({ ok: true, count: 3 })
    expect(typeof data.count).toBe("number")
  })

  it("leaves the url untouched for the app client, which is also the default", async () => {
    const seen: string[] = []
    server.use(
      http.get("*/api/contract/ping", ({ request }) => {
        seen.push(new URL(request.url).pathname)
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiRequest.requestJson({ client: "app", method: "GET", url: "/api/contract/ping" })
    await apiRequest.requestJson({ method: "GET", url: "/api/contract/ping" })

    expect(seen).toEqual(["/api/contract/ping", "/api/contract/ping"])
  })

  it("accepts an explicit axios instance as the client target", async () => {
    server.use(http.get("*/custom/contract/ping", () => HttpResponse.json({ via: "custom" })))

    const custom = axios.create({ baseURL: "/custom" })
    const data = await apiRequest.requestJson<{ via: string }>({
      client: custom,
      method: "GET",
      url: "/contract/ping",
    })

    expect(data).toEqual({ via: "custom" })
  })

  it("serialises query params and sends the request body verbatim", async () => {
    const captured: { query: URLSearchParams | null; body: unknown } = { query: null, body: null }
    server.use(
      http.post("*/backend-api/contract/echo", async ({ request }) => {
        captured.query = new URL(request.url).searchParams
        captured.body = await request.json()
        return HttpResponse.json({ accepted: true })
      }),
    )

    await apiRequest.requestJson({
      client: "backend",
      method: "POST",
      url: "/contract/echo",
      params: { page: 0, size: 25, sortDir: "desc" },
      data: { id: "x-1", flag: false },
    })

    expect(captured.query?.get("page")).toBe("0")
    expect(captured.query?.get("size")).toBe("25")
    expect(captured.query?.get("sortDir")).toBe("desc")
    expect(captured.body).toEqual({ id: "x-1", flag: false })
  })

  it("exposes the raw response through requestResponse", async () => {
    server.use(
      http.get(
        "*/backend-api/contract/raw",
        () => new HttpResponse(JSON.stringify({ ok: true }), { status: 201, headers: { "X-Trace": "abc" } }),
      ),
    )

    const response = await apiRequest.requestResponse<{ ok: boolean }>({
      client: "backend",
      method: "GET",
      url: "/contract/raw",
    })

    expect(response.status).toBe(201)
    expect(response.headers["x-trace"]).toBe("abc")
    expect(response.data).toEqual({ ok: true })
  })
})

describe("apiRequest error normalisation", () => {
  async function expectApiError(
    status: number,
    body: Record<string, unknown> | string | null,
    fallbackMessage = "Request failed",
  ) {
    server.use(http.get("*/backend-api/contract/fail", () => HttpResponse.json(body, { status })))

    const error = await apiRequest
      .requestJson({ client: "backend", method: "GET", url: "/contract/fail", fallbackMessage })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiRequestError)
    return error as ApiRequestError
  }

  it("prefers the `message` field from a 400 body", async () => {
    const error = await expectApiError(400, { message: "Quantity must be positive" })

    expect(error.name).toBe("ApiRequestError")
    expect(error.message).toBe("Quantity must be positive")
    expect(error.status).toBe(400)
    expect(error.data).toEqual({ message: "Quantity must be positive" })
  })

  it("falls back to the `error` field when `message` is absent", async () => {
    const error = await expectApiError(409, { error: "Card already saved" })

    expect(error.message).toBe("Card already saved")
    expect(error.status).toBe(409)
  })

  it("uses the fallback message for a blank message, a non-object body and a 404", async () => {
    expect((await expectApiError(400, { message: "   " }, "Nope")).message).toBe("Nope")
    expect((await expectApiError(500, "boom", "Nope")).message).toBe("Nope")
    expect((await expectApiError(404, null, "Nope")).message).toBe("Nope")
  })

  it("marks 401 as authHandled but leaves 403 for the caller to surface", async () => {
    const unauthorized = await expectApiError(401, { message: "Session expired" })
    expect(unauthorized.status).toBe(401)
    // client.ts logs the user out on 401 and flags the error so callers stay quiet.
    expect(unauthorized.authHandled).toBe(true)

    const forbidden = await expectApiError(403, { message: "Vendor not approved" })
    expect(forbidden.status).toBe(403)
    // 403 is a business-rule rejection, not an expired session — it must be shown inline.
    expect(forbidden.authHandled).toBe(false)
  })

  it("normalises a network failure into an ApiRequestError with no status", async () => {
    server.use(http.get("*/backend-api/contract/fail", () => HttpResponse.error()))

    const error = await apiRequest
      .requestJson({ client: "backend", method: "GET", url: "/contract/fail", fallbackMessage: "Offline" })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBeUndefined()
    expect((error as ApiRequestError).authHandled).toBe(false)
  })

  it("preserves cancellation identity when the request is aborted", async () => {
    server.use(http.get("*/backend-api/contract/slow", () => HttpResponse.json({ ok: true })))

    const controller = new AbortController()
    const pending = apiRequest.requestJson({
      client: "backend",
      method: "GET",
      url: "/contract/slow",
      signal: controller.signal,
    })
    controller.abort()

    const error = await pending.catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiRequestError)
    // Callers distinguish a stale (aborted) request from a real failure via these two fields.
    expect((error as ApiRequestError).code).toBe("ERR_CANCELED")
    expect((error as ApiRequestError).name).toBe("CanceledError")
  })

  it("keeps a blob error response usable instead of throwing a raw axios error", async () => {
    server.use(
      http.get(
        "*/backend-api/contract/blob-error",
        () =>
          new HttpResponse(JSON.stringify({ message: "Invoice not ready" }), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    )

    const error = await apiRequest
      .requestResponse<Blob>({
        client: "backend",
        method: "GET",
        url: "/contract/blob-error",
        responseType: "blob",
        fallbackMessage: "Failed to download invoice",
      })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(409)
    // `parseBlobErrorData` reads the body with `Blob.text()`, which jsdom does not implement, so
    // under the test environment it falls back to handing the Blob through untouched and the
    // caller sees `fallbackMessage`. In a real browser the same path yields "Invoice not ready".
    expect((error as ApiRequestError).data).toBeInstanceOf(Blob)
    expect((error as ApiRequestError).message).toBe("Failed to download invoice")
  })

  it("returns an empty body as-is rather than throwing", async () => {
    server.use(http.delete("*/backend-api/contract/thing", () => new HttpResponse(null, { status: 204 })))

    await expect(apiRequest.requestJson({ client: "backend", method: "DELETE", url: "/contract/thing" })).resolves.toBe(
      "",
    )
  })
})
