import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * The address autocomplete route exists so the Google Maps key stays on the server. These tests
 * assert exactly that: the key must reach Google and must never appear in the response the
 * browser sees.
 */

const GOOGLE = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
const KEY = "server-side-secret-key"

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubEnv("GOOGLE_MAPS_API_KEY", KEY)
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

const prediction = { description: "201 Madison Ave, New York, NY", place_id: "place-1" }

describe("GET /api/google-maps/autocomplete", () => {
  it("forwards the query to Google with the server-side key and returns only predictions", async () => {
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "OK", predictions: [prediction] })
      }),
    )

    const response = await GET(routeRequest("/api/google-maps/autocomplete?query=201%20Madison"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ predictions: [prediction] })

    const upstream = new URL(captured.url ?? "")
    expect(upstream.searchParams.get("input")).toBe("201 Madison")
    expect(upstream.searchParams.get("key")).toBe(KEY)
    expect(upstream.searchParams.get("types")).toBe("address")
  })

  it("never echoes the API key back to the caller", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.json({ status: "OK", predictions: [prediction], key: KEY })))

    const response = await GET(routeRequest("/api/google-maps/autocomplete?query=Madison"))

    // The handler reshapes the payload instead of forwarding it, so a key echoed by Google
    // (or any other upstream field) is dropped.
    await expect(response.text()).resolves.not.toContain(KEY)
  })

  it("url-encodes a query containing spaces, ampersands and unicode", async () => {
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "ZERO_RESULTS", predictions: [] })
      }),
    )

    await GET(routeRequest(`/api/google-maps/autocomplete?query=${encodeURIComponent("Beşiktaş & Co #3")}`))

    expect(new URL(captured.url ?? "").searchParams.get("input")).toBe("Beşiktaş & Co #3")
  })

  it.each([
    ["a missing query", "/api/google-maps/autocomplete"],
    ["an empty query", "/api/google-maps/autocomplete?query="],
    ["a query shorter than 3 characters", "/api/google-maps/autocomplete?query=ma"],
  ])("short-circuits %s with an empty prediction list and no upstream call", async (_label, path) => {
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "OK" })
      }),
    )

    const response = await GET(routeRequest(path))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ predictions: [] })
    expect(captured.count).toBe(0)
  })

  it("answers 500 when no key is configured, without calling Google", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "")
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "")
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "OK" })
      }),
    )

    const response = await GET(routeRequest("/api/google-maps/autocomplete?query=Madison"))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Google Maps API key is not configured" })
    expect(captured.count).toBe(0)
  })

  it("falls back to the NEXT_PUBLIC key when the server-only key is absent", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "")
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "public-key")
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "OK", predictions: [] })
      }),
    )

    await GET(routeRequest("/api/google-maps/autocomplete?query=Madison"))

    // Pinned: a NEXT_PUBLIC_* value is shipped to the browser bundle too, so this fallback
    // silently downgrades a "server-side key" to a public one.
    expect(new URL(captured.url ?? "").searchParams.get("key")).toBe("public-key")
  })

  it("treats ZERO_RESULTS as success with an empty list", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.json({ status: "ZERO_RESULTS" })))

    const response = await GET(routeRequest("/api/google-maps/autocomplete?query=zzzzzz"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ predictions: [] })
  })

  it("maps a genuine client-side status (INVALID_REQUEST) to a 400", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.json({ status: "INVALID_REQUEST" })))

    const response = await GET(routeRequest("/api/google-maps/autocomplete?query=Madison"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: "Google Maps API error: INVALID_REQUEST",
      status: "INVALID_REQUEST",
    })
  })

  // Y16 fix: a quota/billing failure (OVER_QUERY_LIMIT), a bad server key (REQUEST_DENIED), or a
  // transient Google-side failure (UNKNOWN_ERROR) is the server's problem, not the caller's - so
  // these now surface as a 502 (upstream failure) instead of a 400.
  it.each(["OVER_QUERY_LIMIT", "REQUEST_DENIED", "UNKNOWN_ERROR"])(
    "maps the Google upstream status %s to a 502, not a 400",
    async (status) => {
      server.use(http.get(GOOGLE, () => HttpResponse.json({ status })))

      const response = await GET(routeRequest("/api/google-maps/autocomplete?query=Madison"))

      expect(response.status).toBe(502)
      await expect(response.json()).resolves.toEqual({ message: `Google Maps API error: ${status}`, status })
    },
  )

  it("forwards Google's HTTP status when the transport-level call fails", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.text("upstream down", { status: 503 })))

    const response = await GET(routeRequest("/api/google-maps/autocomplete?query=Madison"))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ message: "Failed to fetch places from Google Maps API" })
  })

  it("answers 500 without a stack trace when Google is unreachable", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/google-maps/autocomplete?query=Madison"))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(Object.keys(body)).toEqual(["message"])
    expect(body.message).not.toContain("at ")
    expect(body.message).not.toContain(KEY)
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
