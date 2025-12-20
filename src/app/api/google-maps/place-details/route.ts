import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get("placeId")

    if (!placeId) {
      return NextResponse.json({ message: "placeId is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "Google Maps API key is not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=place_id,formatted_address,geometry,address_components`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch place details from Google Maps API" },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (data.status !== "OK") {
      return NextResponse.json(
        { message: `Google Maps API error: ${data.status}`, status: data.status },
        { status: 400 },
      )
    }

    return NextResponse.json({ result: data.result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
