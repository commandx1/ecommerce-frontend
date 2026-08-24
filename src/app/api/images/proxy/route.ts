import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Default allowlist mirrors the explicit external image hosts declared in next.config.ts's
// images.remotePatterns (excluding the wildcard "**" entries, which are not a real allowlist).
const DEFAULT_ALLOWED_HOSTS = [
  "images.barcodelookup.com",
  "nobledentalsupplies.imgix.net",
  "shippo-static.s3.amazonaws.com",
]

function getAllowedHosts(): Set<string> {
  const fromEnv = process.env.IMAGE_PROXY_ALLOWED_HOSTS
  if (fromEnv?.trim()) {
    return new Set(
      fromEnv
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean),
    )
  }
  return new Set(DEFAULT_ALLOWED_HOSTS)
}

// Proxy endpoint to download images from an allowlisted set of external hosts (bypasses CORS)
// GET /api/images/proxy?url=<encoded-image-url>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get("url")

  if (!imageUrl) {
    return NextResponse.json({ message: "URL parameter is required" }, { status: 400 })
  }

  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(imageUrl)
  } catch {
    return NextResponse.json({ message: "Invalid URL" }, { status: 400 })
  }

  let validatedUrl: URL
  try {
    validatedUrl = new URL(decodedUrl)
  } catch {
    return NextResponse.json({ message: "Invalid URL" }, { status: 400 })
  }

  const allowedHosts = getAllowedHosts()
  if (validatedUrl.protocol !== "https:" || !allowedHosts.has(validatedUrl.hostname)) {
    return NextResponse.json({ message: "Image host is not allowed" }, { status: 400 })
  }

  try {
    const response = await fetch(validatedUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*",
        Referer: validatedUrl.toString(),
      },
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch image" }, { status: 502 })
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
  } catch {
    return NextResponse.json({ message: "Failed to fetch image" }, { status: 502 })
  }
}
