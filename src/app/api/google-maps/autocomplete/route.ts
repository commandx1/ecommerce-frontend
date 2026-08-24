import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Y16: statuses Google returns for its own quota/availability problems, not for anything the
 * caller did wrong. These must not be reported as a 400 (client error) - they are upstream
 * failures, so we answer with a 502 instead. `INVALID_REQUEST` (a malformed request we built) is
 * intentionally excluded and stays a 400.
 */
const GOOGLE_UPSTREAM_ERROR_STATUSES = new Set(["OVER_QUERY_LIMIT", "REQUEST_DENIED", "UNKNOWN_ERROR"])

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query || query.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "Google Maps API key is not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&types=address`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch places from Google Maps API" }, { status: response.status })
    }

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      const status = GOOGLE_UPSTREAM_ERROR_STATUSES.has(data.status) ? 502 : 400
      return NextResponse.json({ message: `Google Maps API error: ${data.status}`, status: data.status }, { status })
    }

    return NextResponse.json({ predictions: data.predictions || [] })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
