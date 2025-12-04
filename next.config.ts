import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "http",
        hostname: "51.20.96.242",
        port: "8080",
      },
      {
        protocol: "https",
        hostname: "images.barcodelookup.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: "http://51.20.96.242:8080/api/:path*",
      },
    ]
  },
}

export default nextConfig
