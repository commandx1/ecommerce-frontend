import { HttpResponse, http } from "msw"
import { afterEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * `/api/images/proxy?url=...` takes a caller-controlled URL and fetches it from the server.
 * That is the classic SSRF shape, so these tests are written primarily as a security contract.
 *
 * FIX (see the report this file used to describe): the handler previously had NO host/protocol
 * allowlist, and the only reason attacker URLs never reached the network was an unrelated bug —
 * it called `serverRequest(path)`, which concatenates `BACKEND_URL + path`. For an absolute URL
 * that produced something like `http://localhost:8080http://169.254.169.254/`, which `fetch`
 * can't parse, so the endpoint always 500'd and never actually returned an image.
 *
 * The handler now fetches the validated absolute URL directly (no `serverRequest` concatenation)
 * AND enforces an explicit https-only host allowlist before ever calling `fetch`, mirroring
 * `/api/shipping-label/download`. Both problems had to be fixed together: fixing only the
 * concatenation bug without adding the allowlist would have turned this into a live SSRF.
 */

afterEach(() => {
  vi.unstubAllEnvs()
})

const attackerUrls = [
  ["cloud metadata (AWS/GCP IMDS)", "http://169.254.169.254/latest/meta-data/iam/security-credentials/"],
  ["loopback / internal service", "http://localhost:8081/api/users"],
  ["private network", "http://10.0.0.5/admin"],
  ["non-http scheme", "file:///etc/passwd"],
  ["disallowed https host", "https://evil.example.com/x.png"],
] as const

describe("GET /api/images/proxy — input validation", () => {
  it("rejects a missing url parameter without touching the network", async () => {
    const captured = createCapture()
    server.use(
      http.get(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.text("x")
      }),
    )

    const response = await GET(routeRequest("/api/images/proxy"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "URL parameter is required" })
    expect(captured.count).toBe(0)
  })

  it("rejects a value that is not an absolute URL", async () => {
    const response = await GET(routeRequest("/api/images/proxy?url=/local/relative.png"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Invalid URL" })
  })

  it("returns a 400 (not a 500) when the parameter is malformed for decodeURIComponent", async () => {
    // A lone `%` survives searchParams.get but blows up decodeURIComponent; this must fail
    // closed as a 400, not leak an internal error as a 500.
    const response = await GET(routeRequest("/api/images/proxy?url=https://example.com/100%25"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Invalid URL" })
  })
})

describe("GET /api/images/proxy — SSRF allowlist", () => {
  it.each(attackerUrls)("rejects %s with 400 and never reaches the network", async (_label, url) => {
    const captured = createCapture()
    server.use(
      http.all("*", ({ request }) => {
        record(captured, request)
        return HttpResponse.text("intercepted")
      }),
    )

    const response = await GET(routeRequest(`/api/images/proxy?url=${encodeURIComponent(url)}`))

    expect(response.status).toBe(400)
    expect(captured.count).toBe(0)

    const body = (await response.json()) as { message: string }
    expect(body.message).toBe("Image host is not allowed")
    expect(body.message).not.toContain(BACKEND)
  })

  it("does not leak the internal backend origin or upstream error text in any response", async () => {
    server.use(http.get("https://cdn.example.com/a.jpg", () => HttpResponse.error()))

    const response = await GET(
      routeRequest(`/api/images/proxy?url=${encodeURIComponent("https://cdn.example.com/a.jpg")}`),
    )

    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain(BACKEND)
    expect(body.message).not.toContain("at ")
    expect(Object.keys(body)).toEqual(["message"])
  })

  it("allows extending the allowlist via IMAGE_PROXY_ALLOWED_HOSTS", async () => {
    vi.stubEnv("IMAGE_PROXY_ALLOWED_HOSTS", "cdn.example.com, other.example.com")
    server.use(
      http.get(
        "https://cdn.example.com/a.jpg",
        () =>
          new HttpResponse(new Blob(["binary"], { type: "image/jpeg" }), {
            headers: { "Content-Type": "image/jpeg" },
          }),
      ),
    )

    const response = await GET(
      routeRequest(`/api/images/proxy?url=${encodeURIComponent("https://cdn.example.com/a.jpg")}`),
    )

    expect(response.status).toBe(200)
  })
})

describe("GET /api/images/proxy — happy path", () => {
  it("returns the image for an allowlisted https host (endpoint now actually works)", async () => {
    server.use(
      http.get(
        "https://images.barcodelookup.com/a.jpg",
        () =>
          new HttpResponse(new Blob(["binary-image-data"], { type: "image/jpeg" }), {
            headers: { "Content-Type": "image/jpeg" },
          }),
      ),
    )

    const response = await GET(
      routeRequest(`/api/images/proxy?url=${encodeURIComponent("https://images.barcodelookup.com/a.jpg")}`),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("image/jpeg")
    const blob = await response.blob()
    expect(blob.size).toBeGreaterThan(0)
  })

  it("returns a generic 502 (no upstream error text) when the upstream fetch fails", async () => {
    server.use(http.get("https://images.barcodelookup.com/missing.jpg", () => HttpResponse.error()))

    const response = await GET(
      routeRequest(`/api/images/proxy?url=${encodeURIComponent("https://images.barcodelookup.com/missing.jpg")}`),
    )

    expect(response.status).toBe(502)
    const body = (await response.json()) as { message: string }
    expect(body.message).toBe("Failed to fetch image")
  })

  it("returns a generic 502 when the upstream responds with a non-ok status", async () => {
    server.use(
      http.get("https://images.barcodelookup.com/notfound.jpg", () => HttpResponse.text("nope", { status: 404 })),
    )

    const response = await GET(
      routeRequest(`/api/images/proxy?url=${encodeURIComponent("https://images.barcodelookup.com/notfound.jpg")}`),
    )

    expect(response.status).toBe(502)
    const body = (await response.json()) as { message: string }
    expect(body.message).toBe("Failed to fetch image")
  })
})

describe("GET /api/images/proxy — route surface", () => {
  it("exposes GET only, so any other verb is a framework 405", async () => {
    const route = await import("./route")

    expect(typeof route.GET).toBe("function")
    expect(Object.keys(route)).toEqual(["GET"])
  })
})
