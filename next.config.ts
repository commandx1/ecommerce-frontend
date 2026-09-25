import path from "node:path"
import type { NextConfig } from "next"

const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:8080"
const backendHostname = new URL(backendBaseUrl).hostname

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Images are served as-is, never through Next's optimizer: external CDNs behind Cloudflare
    // (net32 etc.) 403 the optimizer's server-side fetches, and the self-hosted standalone server
    // must never emit `/_next/image` URLs (K15). `unoptimized` states exactly that; the previous
    // identity `loader` did the same but made next/image warn that width was unused and emit a
    // srcset repeating the same URL once per width.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: backendHostname,
        port: "8080",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.barcodelookup.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nobledentalsupplies.imgix.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "shippo-static.s3.amazonaws.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
  async headers() {
    return [
      // Category photos are overwritten in place (no hashed names), so cache for a day instead of
      // `immutable`; stale-while-revalidate keeps repeat visits instant while an update rolls out.
      {
        // Match only the webp files, not the /categories page route.
        source: "/categories/:file([^/]+\\.webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
      },
      // SockJS/STOMP endpoint lives at backend `/ws` (not under `/api`). `:path*` also matches the
      // bare `/backend-ws`; the SockJS client requests `/info` and `/{server}/{session}/xhr_streaming|xhr_send`.
      {
        source: "/backend-ws/:path*",
        destination: `${backendBaseUrl}/ws/:path*`,
      },
      // Proxy images
      {
        source: "/api/images/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
