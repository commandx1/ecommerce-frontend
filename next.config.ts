import type { NextConfig } from "next"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

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
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      // Old backend host:
      // {
      //   protocol: "http",
      //   hostname: "51.20.96.242",
      //   port: "8080",
      //   pathname: "/**",
      // },
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
        destination: `${backendUrl}/api/:path*`,
        // Old destination: "http://51.20.96.242:8080/api/:path*",
      },
      // Proxy images
      {
        source: "/api/images/:path*",
        destination: `${backendUrl}/:path*`,
        // Old destination: "http://51.20.96.242:8080/:path*",
      },
    ]
  },
}

export default nextConfig
