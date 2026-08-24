import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * `/api/shipping-label/download` streams a Shippo PDF back to the browser. It is the one
 * outbound-URL endpoint in the app that gets SSRF right: https-only plus a host allowlist.
 *
 * FIXED (K9): the route now requires an Authorization header (or the auth-storage cookie, via
 * `getAuthorizationHeader`) before it will fetch or stream a label. It still does not verify the
 * caller owns the specific order the label belongs to — that ownership check would need to live
 * server-side against order data, which this route does not have — but an anonymous caller can no
 * longer pull an arbitrary label merely by guessing/knowing its URL. The `fetch` call is also now
 * wrapped in try/catch, so an unreachable Shippo answers 502 instead of an unhandled rejection.
 */

const LABEL = "https://deliver.goshippo.com/label-abc123.pdf"

const pdf = (body = "%PDF-1.4 fake") =>
  new HttpResponse(body, { status: 200, headers: { "content-type": "application/pdf" } })

describe("GET /api/shipping-label/download — allowlist", () => {
  it("streams the PDF for an allowlisted https host", async () => {
    const captured = createCapture()
    server.use(
      http.get(LABEL, ({ request }) => {
        record(captured, request)
        return pdf()
      }),
    )

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}`, { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    expect(captured.url).toBe(LABEL)
    expect(response.headers.get("content-type")).toBe("application/pdf")
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="shipping-label.pdf"')
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.text()).resolves.toContain("%PDF")
  })

  it.each([
    ["plain http on the allowlisted host", "http://deliver.goshippo.com/label.pdf"],
    ["a look-alike host", "https://deliver.goshippo.com.evil.test/label.pdf"],
    ["a subdomain of the allowlisted host", "https://evil.deliver.goshippo.com/label.pdf"],
    ["cloud metadata", "http://169.254.169.254/latest/meta-data/"],
    ["loopback", "https://localhost:8081/label.pdf"],
    ["a file URL", "file:///etc/passwd"],
  ])("rejects %s with 400 and no outbound request", async (_label, url) => {
    const captured = createCapture()
    server.use(
      http.all("*", ({ request }) => {
        record(captured, request)
        return pdf()
      }),
    )

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(url)}`, { authorization: AUTH }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Shipping label host is not allowed" })
    expect(captured.count).toBe(0)
  })

  it("rejects a missing url with 400", async () => {
    const response = await GET(routeRequest("/api/shipping-label/download", { authorization: AUTH }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Shipping label URL is required" })
  })

  it("rejects an unparseable url with 400", async () => {
    const response = await GET(routeRequest("/api/shipping-label/download?url=not-a-url", { authorization: AUTH }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Invalid shipping label URL" })
  })
})

describe("GET /api/shipping-label/download — authorization", () => {
  it("answers 401 without calling the backend when there is no Authorization header or session cookie", async () => {
    const captured = createCapture()
    server.use(
      http.get(LABEL, ({ request }) => {
        record(captured, request)
        return pdf()
      }),
    )

    const response = await GET(routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}`))

    // FIXED (K9): previously this served the PDF to anyone who knew/guessed the label URL.
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("accepts the auth-storage cookie in place of an Authorization header", async () => {
    server.use(http.get(LABEL, () => pdf()))
    const cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: "cookie-token" } }))}`

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}`, { cookie }),
    )

    expect(response.status).toBe(200)
  })

  it("serves the label to an authenticated caller", async () => {
    server.use(http.get(LABEL, () => pdf()))

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}`, { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
  })
})

describe("GET /api/shipping-label/download — filename handling", () => {
  it("sanitises the filename so it cannot escape the download directory or inject a header", async () => {
    server.use(http.get(LABEL, () => pdf()))

    const response = await GET(
      routeRequest(
        `/api/shipping-label/download?url=${encodeURIComponent(LABEL)}&filename=${encodeURIComponent('../../etc/pa"sswd')}`,
        { authorization: AUTH },
      ),
    )

    const disposition = response.headers.get("content-disposition") ?? ""
    expect(disposition).toBe('attachment; filename="..-..-etc-pa-sswd.pdf"')
    expect(disposition).not.toContain("/")
    expect(disposition.match(/"/g)).toHaveLength(2)
  })

  it("keeps an already-.pdf filename and appends .pdf otherwise", async () => {
    server.use(http.get(LABEL, () => pdf()))

    const keep = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}&filename=order-42.pdf`, {
        authorization: AUTH,
      }),
    )
    const append = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}&filename=order-42`, {
        authorization: AUTH,
      }),
    )

    expect(keep.headers.get("content-disposition")).toBe('attachment; filename="order-42.pdf"')
    expect(append.headers.get("content-disposition")).toBe('attachment; filename="order-42.pdf"')
  })

  it("truncates a very long filename to 80 characters before adding the extension", async () => {
    server.use(http.get(LABEL, () => pdf()))

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}&filename=${"a".repeat(200)}`, {
        authorization: AUTH,
      }),
    )

    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="${"a".repeat(80)}.pdf"`)
  })

  it("falls back to the default name when sanitising leaves nothing usable", async () => {
    server.use(http.get(LABEL, () => pdf()))

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}&filename=%2F`, {
        authorization: AUTH,
      }),
    )

    expect(response.headers.get("content-disposition")).toBe('attachment; filename="-.pdf"')
  })
})

describe("GET /api/shipping-label/download — upstream failures", () => {
  it("forwards the upstream status when Shippo says the label is gone", async () => {
    server.use(http.get(LABEL, () => new HttpResponse(null, { status: 404 })))

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}`, { authorization: AUTH }),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ message: "Shipping label could not be downloaded" })
  })

  it("forwards a 500 without leaking upstream detail", async () => {
    server.use(http.get(LABEL, () => HttpResponse.text("Traceback: shippo internals", { status: 500 })))

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}`, { authorization: AUTH }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Shipping label could not be downloaded" })
  })

  it("answers 502 with a generic message when the transport itself fails", async () => {
    server.use(http.get(LABEL, () => HttpResponse.error()))

    const response = await GET(
      routeRequest(`/api/shipping-label/download?url=${encodeURIComponent(LABEL)}`, { authorization: AUTH }),
    )

    // FIXED (K9): the fetch is now wrapped in try/catch, so an unreachable Shippo answers a clean
    // 502 instead of surfacing as an unhandled rejection.
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Shipping label could not be downloaded" })
  })
})

describe("GET /api/shipping-label/download — route surface", () => {
  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
