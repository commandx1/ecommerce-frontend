import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const GOOGLE = "https://maps.googleapis.com/maps/api/place/details/json"
const KEY = "server-side-secret-key"

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubEnv("GOOGLE_MAPS_API_KEY", KEY)
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

const result = { place_id: "place-1", formatted_address: "201 Madison Ave, New York, NY" }

describe("GET /api/google-maps/place-details", () => {
  it("asks Google for exactly the address fields the checkout form needs", async () => {
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "OK", result })
      }),
    )

    const response = await GET(routeRequest("/api/google-maps/place-details?placeId=place-1"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ result })

    const upstream = new URL(captured.url ?? "")
    expect(upstream.searchParams.get("place_id")).toBe("place-1")
    expect(upstream.searchParams.get("key")).toBe(KEY)
    expect(upstream.searchParams.get("fields")).toBe("place_id,formatted_address,geometry,address_components")
  })

  it("url-encodes a placeId with reserved characters", async () => {
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "OK", result })
      }),
    )

    await GET(routeRequest(`/api/google-maps/place-details?placeId=${encodeURIComponent("a b&key=leak")}`))

    const upstream = new URL(captured.url ?? "")
    expect(upstream.searchParams.get("place_id")).toBe("a b&key=leak")
    // Query-injection guard: the caller cannot append their own `key` parameter.
    expect(upstream.searchParams.getAll("key")).toEqual([KEY])
  })

  it("never echoes the API key back to the caller", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.json({ status: "OK", result, key: KEY })))

    const response = await GET(routeRequest("/api/google-maps/place-details?placeId=place-1"))

    await expect(response.text()).resolves.not.toContain(KEY)
  })

  it("rejects a missing placeId with 400 and no upstream call", async () => {
    const captured = createCapture()
    server.use(
      http.get(GOOGLE, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ status: "OK" })
      }),
    )

    const response = await GET(routeRequest("/api/google-maps/place-details"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "placeId is required" })
    expect(captured.count).toBe(0)
  })

  it("answers 500 when no key is configured", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "")
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "")

    const response = await GET(routeRequest("/api/google-maps/place-details?placeId=place-1"))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Google Maps API key is not configured" })
  })

  it("treats ZERO_RESULTS as an error here, unlike the autocomplete route", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.json({ status: "ZERO_RESULTS" })))

    const response = await GET(routeRequest("/api/google-maps/place-details?placeId=missing"))

    // Deliberate divergence between the two Google routes; locked so it cannot drift silently.
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: "Google Maps API error: ZERO_RESULTS",
      status: "ZERO_RESULTS",
    })
  })

  it("maps a genuine client-side status (NOT_FOUND, the placeId didn't resolve) to a 400", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.json({ status: "NOT_FOUND" })))

    const response = await GET(routeRequest("/api/google-maps/place-details?placeId=place-1"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: "Google Maps API error: NOT_FOUND",
      status: "NOT_FOUND",
    })
  })

  // Y16 fix: a quota/billing failure (OVER_QUERY_LIMIT), a bad server key (REQUEST_DENIED), or a
  // transient Google-side failure (UNKNOWN_ERROR) is the server's problem, not the caller's - so
  // these now surface as a 502 (upstream failure) instead of a 400.
  it.each(["OVER_QUERY_LIMIT", "REQUEST_DENIED", "UNKNOWN_ERROR"])(
    "maps the Google upstream status %s to a 502, not a 400",
    async (status) => {
      server.use(http.get(GOOGLE, () => HttpResponse.json({ status })))

      const response = await GET(routeRequest("/api/google-maps/place-details?placeId=place-1"))

      expect(response.status).toBe(502)
      await expect(response.json()).resolves.toEqual({ message: `Google Maps API error: ${status}`, status })
    },
  )

  it("forwards Google's HTTP status on an upstream failure", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.text("nope", { status: 502 })))

    const response = await GET(routeRequest("/api/google-maps/place-details?placeId=place-1"))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Failed to fetch place details from Google Maps API" })
  })

  it("answers 500 without leaking the key or a stack trace when Google is unreachable", async () => {
    server.use(http.get(GOOGLE, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/google-maps/place-details?placeId=place-1"))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain(KEY)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
