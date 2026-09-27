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
  async redirects() {
    return [
      // The buyer dashboard has no overview yet (see app/buyer-dashboard/page.tsx). Redirecting here,
      // before the proxy and before any render, keeps it a single request. `redirect()` in that page
      // sits under the dashboard's `loading.tsx`, so it reaches the browser as a SECOND, client-side
      // navigation fired after hydration - and when the tab is in the background, the proxy judges
      // that hop with the FOCUSED tab's cookie (a vendor tab bounced it to /vendor-dashboard, whose
      // guard then took the shared cookie back from the tab the user was looking at). The vendor
      // guard's cross-role target is /buyer-dashboard too, so its redirect paid for that hop as well.
      { source: "/buyer-dashboard", destination: "/buyer-dashboard/orders", permanent: false },
      // Same class of bug as /buyer-dashboard above: these four legacy URLs used to redirect()
      // from inside their own page.tsx, which sits under the dashboard's loading.tsx and so
      // streams to the browser as a second, client-side navigation - vulnerable to the same
      // background-tab cookie mix-up. Answering them here is one request, judged once. The
      // page.tsx files stay in place as a harmless fallback (see routes.test.tsx) in case a
      // build ever serves them without this config (e.g. a stale edge cache).
      {
        source: "/buyer-dashboard/vendors",
        destination: "/buyer-dashboard/favorites?tab=vendors",
        permanent: false,
      },
      {
        source: "/buyer-dashboard/vendors/favorites",
        destination: "/buyer-dashboard/favorites?tab=vendors",
        permanent: false,
      },
      {
        source: "/buyer-dashboard/suppliers",
        destination: "/buyer-dashboard/favorites?tab=vendors",
        permanent: false,
      },
      {
        source: "/buyer-dashboard/suppliers/favorites",
        destination: "/buyer-dashboard/favorites?tab=vendors",
        permanent: false,
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
