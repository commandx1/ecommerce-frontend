import type { NextConfig } from "next"

const backendBaseUrl = process.env.BACKEND_URL

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "51.20.96.242",
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
