import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

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
      return NextResponse.json(
        { message: `Google Maps API error: ${data.status}`, status: data.status },
        { status: 400 },
      )
    }

    return NextResponse.json({ predictions: data.predictions || [] })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
