import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Proxy endpoint to download images from external URLs (bypasses CORS)
// GET /api/images/proxy?url=<encoded-image-url>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("url")

    if (!imageUrl) {
      return NextResponse.json({ message: "URL parameter is required" }, { status: 400 })
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl)

    // Validate URL
    try {
      new URL(decodedUrl)
    } catch {
      return NextResponse.json({ message: "Invalid URL" }, { status: 400 })
    }

    // Fetch the image from external source
    const response = await fetch(decodedUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*",
        Referer: decodedUrl,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to fetch image: ${response.statusText}`, status: response.status },
        { status: response.status },
      )
    }

    // Get the image as blob
    const blob = await response.blob()

    // Get content type from response or default to image/jpeg
    const contentType = response.headers.get("content-type") || "image/jpeg"

    // Return the image with proper headers
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

