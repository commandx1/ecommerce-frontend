import type { NextConfig } from "next"

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
        destination: "http://51.20.96.242:8080/api/:path*",
      },
      // Proxy images
      {
        source: "/api/images/:path*",
        destination: "http://51.20.96.242:8080/:path*",
      },
    ]
  },
}

export default nextConfig
