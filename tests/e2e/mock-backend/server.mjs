/**
 * Faz 8.2 - standalone fake backend for the SSR paths that `page.route`
 * (tests/e2e/fixtures/api-mock.fixture.ts) structurally cannot see.
 *
 * `/`, `/products`, `/products/:id` are Server Components. Their data comes
 * from `BACKEND_URL` fetches issued by the Next.js SERVER process itself
 * (src/lib/api/public-products.ts, src/lib/api/product-detail.ts,
 * src/lib/api/server-request.ts, src/features/products/api/proxy/http.ts -
 * all four read `process.env.BACKEND_URL ?? "http://localhost:8080"` at
 * MODULE LOAD time). Those requests never touch the browser, so Playwright's
 * `page.route` never intercepts them. This process stands in for the real
 * backend on 127.0.0.1:4010; playwright.config.ts points a dedicated Next.js
 * instance (port 3100) at it via `BACKEND_URL=http://127.0.0.1:4010`.
 *
 * Route inventory (derived by READING the fetchers below, not assumed):
 *  - GET /api/products/public                    <- src/lib/api/public-products.ts getPublicProducts()
 *      called by src/features/products/listing/server/get-listing-page-data.ts
 *      (src/app/products/page.tsx)
 *  - GET /api/products/brands                     <- getProductBrandOptions()       (same caller)
 *  - GET /api/products/manufacturers               <- getProductManufacturerOptions() (same caller)
 *  - GET /api/products/vendors                     <- getProductVendorOptions()      (same caller)
 *  - GET /api/products/categories                  <- getProductCategoryOptions()    (same caller)
 *  - GET /api/products/attributes                  <- getProductAttributeOptions()   (same caller)
 *      (getProductCompanyOptions() / GET /api/products/companies exists in
 *      public-products.ts but get-listing-page-data.ts does NOT call it -
 *      confirmed by reading the destructured Promise.all in that file -
 *      intentionally NOT registered here.)
 *  - GET /api/products/:id/with-user-products      <- src/lib/api/product-detail.ts fetchProductDetailPageData()
 *      called by src/features/products/product-detail/server/get-product-detail-page-data.ts
 *      (src/app/products/[id]/page.tsx, both the page body and generateMetadata)
 *  - GET /api/product-questions/product/:id        <- fetchProductDetailPageData() (same file, questions leg)
 *  - GET /api/reviews/product/:id                  <- fetchProductReviews() in product-detail.ts
 *      (getProductReviews(), called alongside getProductDetailPageData() in the page body)
 *  - GET /api/users/me                             <- resolveBackendHeaders() in product-detail.ts,
 *      called ONLY when an `auth-storage` cookie with an accessToken is present
 *      (buyerPage/vendorPage fixtures - guestPage never triggers this)
 *
 * NOT included, and why:
 *  - Home page (`/`, src/features/home/HomePage.tsx) reads
 *    `@/data/*.json` static files directly - zero BACKEND_URL calls at SSR.
 *    Confirmed by reading HomePage.tsx: no fetch, no `api/` import.
 *  - `/api/images/*` (src/app/api/images/proxy/route.ts, which DOES call
 *    server-request.ts -> BACKEND_URL) is requested by the BROWSER
 *    (`<img src="/api/images/proxy?...">`), so it's same-origin from the
 *    page's point of view and is already caught by
 *    `apiMock`'s `page.route("**\/api/**")` before it ever reaches this
 *    Next.js route handler / this fake backend. Confirmed: api-mock.fixture.ts
 *    registers `page.route("**\/api/**", ...)`, which matches
 *    `/api/images/proxy` same as any other same-origin `/api/**` call.
 *  - src/features/products/api/proxy/http.ts (`proxyRequest`) backs the
 *    Next.js `/api/products/:id` PUT/DELETE BFF routes - those are also
 *    invoked BY THE BROWSER (same-origin `/api/products/:id`), so they're
 *    caught by `apiMock` first, same reasoning as the image proxy. It reads
 *    BACKEND_URL at module load (matching the task brief's list of modules
 *    to check) but its handler is never reached by SSR/browser traffic in
 *    the specs this task covers - not wired here.
 *  - next.config.ts's `/backend-api/:path*` rewrite also points at
 *    BACKEND_URL, but `/backend-api/**` browser calls are intercepted by
 *    `apiMock` before the rewrite is ever consulted.
 *
 * Any request that doesn't match one of the routes above is answered with
 * `599` and logged to stderr - no silent 200 fallback (mirrors
 * api-mock.fixture.ts's own strictness).
 *
 * This file is plain JavaScript (`.mjs`), NOT `.ts`, on purpose: `next build`
 * type-checks every `**\/*.ts` file under this project's tsconfig.json
 * ("include": ["**\/*.ts", ...], no exclusion for tests/e2e/), and a relative
 * import ending in `.ts` (needed for Node's own ESM resolver, see below)
 * trips tsc's "An import path can only end with a '.ts' extension when
 * 'allowImportingTsExtensions' is enabled" - confirmed by actually running
 * `next build` against an earlier `.ts` version of this file. `.mjs` is
 * outside tsc's include glob, so `next build` never looks inside it.
 *
 * Run standalone: `node --experimental-strip-types tests/e2e/mock-backend/server.mjs`
 * The `--experimental-strip-types` flag is still required (even though this
 * entrypoint is plain JS) because it imports the `.ts` factory modules below
 * directly - no `tsx` in this repo's devDependencies, and none was added;
 * Node 22's native TS type-stripping is enough since every import inside
 * those factory files is an `import type` that strip-types erases entirely
 * (confirmed empirically before writing this file - `node
 * --experimental-strip-types` on a throwaway script importing
 * product.factory.ts ran with zero unresolved runtime imports).
 */
import { createServer } from "node:http"
import { makeProduct } from "../../../src/test/factories/product.factory.ts"
import { makeAccountUser } from "../../../src/test/factories/user.factory.ts"

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 4010)
const HOST = process.env.MOCK_BACKEND_HOST ?? "127.0.0.1"

// 1x1 transparent PNG - reserved for any image byte payload this fake backend
// might need to serve (see /__image below; not currently on the hot path).
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
)

const routes = []

function on(method, path, handler) {
  routes.push({ method, segments: path.split("/").filter(Boolean), handler })
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  })
  res.end(payload)
}

function emptyPage(content = []) {
  return {
    content,
    pageable: {
      pageNumber: 0,
      pageSize: 10,
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      paged: true,
      unpaged: false,
    },
    last: true,
    totalPages: content.length > 0 ? 1 : 0,
    totalElements: content.length,
    size: 10,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    numberOfElements: content.length,
    first: true,
    empty: content.length === 0,
  }
}

/** Base catalog product shared by the listing and detail factories, via `makeProduct()`. */
const baseProduct = makeProduct()

// ---------------------------------------------------------------------------
// GET /api/products/public - src/lib/api/public-products.ts getPublicProducts()
// ---------------------------------------------------------------------------
on("GET", "/api/products/public", (_req, res) => {
  const listingProduct = {
    productId: baseProduct.id,
    productName: baseProduct.name,
    brand: baseProduct.brand,
    barcode: String(baseProduct.barcode ?? ""),
    coverPhotoPath: baseProduct.coverPhotoPath,
    manufacturerCode: "MK-1001",
    reorderId: "reorder-1",
    referanceNumber: "ref-1",
    overallStar: baseProduct.overallStar,
    reviewCount: baseProduct.reviewCount,
    vendorsCount: baseProduct.vendorsCount,
    bestPriceVendor: "Acme Dental Supplies",
    price: 56,
    oldPrice: 70,
    discount: 20,
    stock: 40,
  }
  sendJson(res, 200, { content: [listingProduct], totalElements: 1, totalPages: 1 })
})

on("GET", "/api/products/brands", (_req, res) => {
  sendJson(res, 200, [{ name: baseProduct.brand, count: 1 }])
})

on("GET", "/api/products/manufacturers", (_req, res) => {
  sendJson(res, 200, [{ name: "MARK3", count: 1 }])
})

on("GET", "/api/products/vendors", (_req, res) => {
  sendJson(res, 200, [{ id: "vendor-1", name: "Acme Dental Supplies", count: 1 }])
})

on("GET", "/api/products/categories", (_req, res) => {
  sendJson(res, 200, [{ name: "Consumables", count: 1 }])
})

on("GET", "/api/products/attributes", (_req, res) => {
  sendJson(res, 200, [{ attributeName: "Color", values: [{ value: "Yellow", count: 1 }] }])
})

// ---------------------------------------------------------------------------
// GET /api/products/:id/with-user-products - src/lib/api/product-detail.ts
// fetchProductDetailPageData(). Two userProducts so the supplier comparison
// table renders a "Select" button (only the non-selected supplier gets one -
// see buildSuppliers()/useSupplierSelection.ts: the cheapest (up-1, $56) is
// the default selection, so up-2 ($62) is the one with a visible "Select").
// ---------------------------------------------------------------------------
on("GET", "/api/products/:id/with-user-products", (_req, res, params) => {
  const product = {
    ...baseProduct,
    id: params.id,
    price: 56,
    oldPrice: 70,
    discount: 20,
    bestPriceVendorUserProductId: "up-1",
    dentalLicenseRequired: "No",
  }
  const userProducts = [
    {
      id: "up-1",
      vendor: "Acme Dental Supplies",
      price: 56,
      oldPrice: 70,
      discount: 20,
      stock: 40,
      shipmentFee: 5,
      heavyShippingSurcharge: 0,
      vendorRating: 4.6,
      vendorReviewCount: 32,
    },
    {
      id: "up-2",
      vendor: "Best Dental Co",
      price: 62,
      oldPrice: 0,
      discount: 0,
      stock: 20,
      shipmentFee: 0,
      heavyShippingSurcharge: 0,
      vendorRating: 4.1,
      vendorReviewCount: 8,
    },
  ]
  sendJson(res, 200, { product, userProducts })
})

// ---------------------------------------------------------------------------
// GET /api/product-questions/product/:id - fetchProductDetailPageData() questions leg
// ---------------------------------------------------------------------------
on("GET", "/api/product-questions/product/:id", (_req, res) => {
  sendJson(res, 200, emptyPage())
})

// ---------------------------------------------------------------------------
// GET /api/reviews/product/:id - fetchProductReviews()
// ---------------------------------------------------------------------------
on("GET", "/api/reviews/product/:id", (_req, res) => {
  sendJson(res, 200, emptyPage())
})

// ---------------------------------------------------------------------------
// GET /api/users/me - resolveBackendHeaders() (only hit when an auth cookie
// with an accessToken is present - buyerPage / vendorPage fixtures).
// ---------------------------------------------------------------------------
on("GET", "/api/users/me", (_req, res) => {
  sendJson(res, 200, makeAccountUser())
})

// ---------------------------------------------------------------------------
// Health check for playwright.config.ts's webServer.url
// ---------------------------------------------------------------------------
on("GET", "/__health", (_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("ok")
})

// A generic image byte responder, kept for completeness even though the
// browser-side image proxy request never reaches this process (see the
// header comment) - some future SSR path may want it.
on("GET", "/__image", (_req, res) => {
  res.writeHead(200, { "Content-Type": "image/png", "Content-Length": TRANSPARENT_PNG.length })
  res.end(TRANSPARENT_PNG)
})

function matchRoute(method, pathname) {
  const pathSegments = pathname.split("/").filter(Boolean)
  for (const route of routes) {
    if (route.method !== method) continue
    if (route.segments.length !== pathSegments.length) continue

    const params = {}
    let matched = true
    for (let i = 0; i < route.segments.length; i++) {
      const routeSegment = route.segments[i]
      const actualSegment = pathSegments[i]
      if (routeSegment.startsWith(":")) {
        params[routeSegment.slice(1)] = decodeURIComponent(actualSegment)
      } else if (routeSegment !== actualSegment) {
        matched = false
        break
      }
    }
    if (matched) return { route, params }
  }
  return null
}

const server = createServer((req, res) => {
  const method = (req.method ?? "GET").toUpperCase()
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`)
  const match = matchRoute(method, url.pathname)

  if (!match) {
    process.stderr.write(`[mock-backend] UNMATCHED ${method} ${url.pathname}${url.search}\n`)
    sendJson(res, 599, {
      message: `mock-backend: no route registered for ${method} ${url.pathname}`,
    })
    return
  }

  match.route.handler(req, res, match.params, url)
})

server.listen(PORT, HOST, () => {
  process.stderr.write(`[mock-backend] listening on http://${HOST}:${PORT}\n`)
})
