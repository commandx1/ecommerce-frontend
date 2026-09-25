// Use Next.js API routes as proxy to avoid CORS issues
const IMAGE_PROXY_URL = "/api/images" // Proxy path for images

function normalizeBackendImagePath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`

  // Backend static files are served under `/uploads/...`.
  // Some payloads may still contain `/api/uploads/...`; normalize both to `/uploads/...`.
  if (cleanPath.startsWith("/api/uploads/")) {
    return cleanPath.replace(/^\/api/, "")
  }

  return cleanPath
}

export function getFullImageUrl(path: string | null | undefined): string {
  if (!path || typeof path !== "string" || path.trim() === "") return ""

  const trimmedPath = path.trim()

  let fullUrl: string
  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    fullUrl = trimmedPath
  } else {
    // Use the image proxy to avoid Mixed Content (HTTPS -> HTTP) issues
    const normalizedPath = normalizeBackendImagePath(trimmedPath)
    fullUrl = `${IMAGE_PROXY_URL}${normalizedPath}`
  }

  return fullUrl
}
