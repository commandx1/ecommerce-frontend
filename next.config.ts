import path from "node:path"
import type { NextConfig } from "next"

const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:8080"
const backendHostname = new URL(backendBaseUrl).hostname

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    unoptimized: false,
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
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
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
