import {
  makeActiveProductSearchItem,
  makeMyProductsPageResponse,
  makeProduct,
  makePublicProductsResponse,
  makeUserProductDetailResponse,
  makeUserProductsFilterResponse,
  makeVendorUserProduct,
} from "@/test/factories/product.factory"
import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * Mirrors src/mocks/handlers/products.handlers.ts, EXCEPT:
 *  - `GET /api/products/active`, `/brands/search`, `/brands`, `/manufacturers`,
 *    `/vendors`, `/companies`, `/categories`, `/attributes` - each returns a
 *    small handler-literal object/array (e.g. `[{ name: "MARK3", count: 24 }]`,
 *    or `makeActiveProductSearchItem()` wrapped in a handler-literal page
 *    object) with no corresponding exported factory to reproduce the whole
 *    response from. Copying those literals here would create a second
 *    source of truth. See the Faz 8.1 infra report's "missing exports" list.
 *  - `GET /api/user-products/brands` - same reason (handler-literal array).
 *
 * Note the products domain uses the Next.js API routes (`/api/...`), NOT
 * `/backend-api/...` - see trap (6) in the task brief.
 *
 * Ordering: `GET /api/products/my-products`, `GET /api/products/public`, and
 * `GET /api/products/public-search` are registered BEFORE
 * `GET /api/products/:id` (same segment count, first match wins - see the
 * fixture's doc-comment). Same for `GET /api/user-products/filter` before
 * `GET /api/user-products/:id`.
 */
export function registerProductsMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/api/products/my-products", () => ({ body: makeMyProductsPageResponse() }))
  apiMock.on("GET", "/api/products/public", () => ({ body: makePublicProductsResponse() }))
  /**
   * Faz 8.2 - src/lib/api/product-search.ts searchPublicProducts() (used by
   * the header search box, src/components/search/main-searchbox/**). This is
   * a BROWSER-issued same-origin call (Next.js API route
   * src/app/api/products/public-search/route.ts), so `apiMock`'s
   * `page.route("**\/api/**")` catches it before it ever reaches that route
   * handler (which would otherwise proxy to BACKEND_URL) - registering it
   * here is enough, no fake-backend involvement needed. `SearchProduct` has
   * no dedicated factory; `makeActiveProductSearchItem()` (used elsewhere for
   * the same backend "active product search" shape) supplies the overlapping
   * fields (id/name/coverPhotoPath/brand/manufacturer/manufacturerCode).
   */
  apiMock.on("GET", "/api/products/public-search", () => {
    const item = makeActiveProductSearchItem()
    return {
      body: {
        content: [
          {
            productId: item.id,
            productName: item.name,
            barcode: "123456789012",
            coverPhotoPath: item.coverPhotoPath,
            secureCode: "secure-1",
            manufacturerCode: item.manufacturerCode,
            reorderId: "reorder-1",
            referanceNumber: "ref-1",
            userId: "vendor-1",
            price: 56,
            oldPrice: 70,
            discount: 20,
            stock: 40,
          },
        ],
        pageable: {
          pageNumber: 0,
          pageSize: 20,
          sort: { empty: true, unsorted: true, sorted: false },
          offset: 0,
          unpaged: false,
          paged: true,
        },
        last: true,
        totalPages: 1,
        totalElements: 1,
        size: 20,
        number: 0,
        sort: { empty: true, unsorted: true, sorted: false },
        numberOfElements: 1,
        first: true,
        empty: false,
      },
    }
  })

  apiMock.on("POST", "/api/products/review", () => ({ body: makeProduct() }))
  apiMock.on("PUT", "/api/products/review/:id", ({ params }) => ({ body: makeProduct({ id: params.id }) }))

  apiMock.on("POST", "/api/products", () => ({ body: makeProduct() }))
  apiMock.on("GET", "/api/products/:id/owner", ({ params }) => ({ body: makeProduct({ id: params.id }) }))
  apiMock.on("GET", "/api/products/:id", ({ params }) => ({ body: makeProduct({ id: params.id }) }))
  apiMock.on("PUT", "/api/products/:id", ({ params }) => ({ body: makeProduct({ id: params.id }) }))
  apiMock.on("DELETE", "/api/products/:id", () => ({ status: 204 }))

  apiMock.on("GET", "/api/user-products/filter", () => ({ body: makeUserProductsFilterResponse() }))
  apiMock.on("POST", "/api/user-products/bulk-discount", () => ({ body: [makeVendorUserProduct()] }))
  apiMock.on("POST", "/api/user-products", () => ({ body: makeVendorUserProduct() }))
  apiMock.on("GET", "/api/user-products/:id", ({ params }) => ({
    body: makeUserProductDetailResponse({ id: params.id }),
  }))
  apiMock.on("GET", "/api/user-products", () => ({ body: [makeVendorUserProduct()] }))
}
