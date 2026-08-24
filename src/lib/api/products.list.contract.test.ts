import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import {
  makeMyProductsPageResponse,
  makeProduct,
  makeUserProductDetailResponse,
  makeVendorProductReviewItem,
  makeVendorUserProduct,
} from "@/test/factories"
import { getFullImageUrl, productsAPI } from "./products"
import { ApiRequestError } from "./request"

let capturedMyProductsQuery: URLSearchParams | null = null
let capturedMyProductsAuthHeader: string | null | undefined
let capturedGetByIdAuthHeader: string | null | undefined

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. `products.ts` calls the Next.js `/api/...` route handlers directly (not
 * `/backend-api/...`), so every handler here must match `*` + `/api/...`.
 */
beforeEach(() => {
  capturedMyProductsQuery = null
  capturedMyProductsAuthHeader = undefined
  capturedGetByIdAuthHeader = undefined

  server.use(
    http.get("*/api/products/my-products", ({ request }) => {
      capturedMyProductsQuery = new URL(request.url).searchParams
      capturedMyProductsAuthHeader = request.headers.get("authorization")
      return HttpResponse.json(makeMyProductsPageResponse())
    }),
    http.get("*/api/products/:id/owner", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),
    http.get("*/api/products/:id", ({ request, params }) => {
      capturedGetByIdAuthHeader = request.headers.get("authorization")
      return HttpResponse.json(makeProduct({ id: String(params.id) }))
    }),
    http.get("*/api/user-products", () => HttpResponse.json([makeVendorUserProduct()])),
    http.get("*/api/user-products/:id", ({ params }) =>
      HttpResponse.json(makeUserProductDetailResponse({ id: String(params.id) })),
    ),
  )
})

describe("productsAPI.getMyProducts contract", () => {
  it("returns the typed review-status page response", async () => {
    const response = await productsAPI.getMyProducts("token-1")

    expect(response.content).toHaveLength(1)
    expect(response.content[0]).toEqual(makeVendorProductReviewItem())
    expect(response.totalElements).toBe(1)
    expect(response.totalPages).toBe(1)
    expect(capturedMyProductsAuthHeader).toBe("Bearer token-1")
  })

  it("defaults approved=ALL, sortBy=createdDate, sortDir=desc, page=0, size=1000", async () => {
    await productsAPI.getMyProducts("token-1")

    expect(capturedMyProductsQuery?.get("approved")).toBe("ALL")
    expect(capturedMyProductsQuery?.get("sortBy")).toBe("createdDate")
    expect(capturedMyProductsQuery?.get("sortDir")).toBe("desc")
    expect(capturedMyProductsQuery?.get("page")).toBe("0")
    expect(capturedMyProductsQuery?.get("size")).toBe("1000")
  })

  it("serializes explicit params over the defaults", async () => {
    await productsAPI.getMyProducts("token-1", {
      approved: "TRUE",
      sortBy: "updatedDate",
      sortDir: "asc",
      page: 2,
      size: 25,
    })

    expect(capturedMyProductsQuery?.get("approved")).toBe("TRUE")
    expect(capturedMyProductsQuery?.get("sortBy")).toBe("updatedDate")
    expect(capturedMyProductsQuery?.get("sortDir")).toBe("asc")
    expect(capturedMyProductsQuery?.get("page")).toBe("2")
    expect(capturedMyProductsQuery?.get("size")).toBe("25")
  })

  it("tolerates an empty content array", async () => {
    server.use(
      http.get("*/api/products/my-products", () => HttpResponse.json(makeMyProductsPageResponse({ content: [] }))),
    )

    const response = await productsAPI.getMyProducts("token-1")
    expect(response.content).toEqual([])
  })

  it("tolerates a review item with no userProduct (still pending listing)", async () => {
    server.use(
      http.get("*/api/products/my-products", () =>
        HttpResponse.json(
          makeMyProductsPageResponse({ content: [makeVendorProductReviewItem({ userProduct: undefined })] }),
        ),
      ),
    )

    const response = await productsAPI.getMyProducts("token-1")
    expect(response.content[0]?.userProduct).toBeUndefined()
  })

  it("rejects with the backend message on 401 and marks authHandled", async () => {
    server.use(
      http.get("*/api/products/my-products", () => HttpResponse.json({ message: "Session expired" }, { status: 401 })),
    )

    const error = await productsAPI.getMyProducts("expired-token").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(401)
    expect((error as ApiRequestError).authHandled).toBe(true)
    expect((error as ApiRequestError).message).toBe("Session expired")
  })

  it("rejects with the fallback message on 500", async () => {
    server.use(http.get("*/api/products/my-products", () => new HttpResponse(null, { status: 500 })))

    await expect(productsAPI.getMyProducts("token-1")).rejects.toThrow("Failed to fetch review status for products")
  })

  it("rejects on network failure", async () => {
    server.use(http.get("*/api/products/my-products", () => HttpResponse.error()))

    await expect(productsAPI.getMyProducts("token-1")).rejects.toThrow()
  })
})

describe("productsAPI.getProductById / getProductByIdForOwner contract", () => {
  it("getProductById returns the typed product and attaches the bearer token when given", async () => {
    const product = await productsAPI.getProductById("p-1", "token-1")

    expect(product).toEqual(makeProduct({ id: "p-1" }))
    expect(capturedGetByIdAuthHeader).toBe("Bearer token-1")
  })

  it("getProductById omits the Authorization header when no token is given", async () => {
    await productsAPI.getProductById("p-1")

    expect(capturedGetByIdAuthHeader).toBeNull()
  })

  it("getProductByIdForOwner returns the typed product for pending/rejected products", async () => {
    const product = await productsAPI.getProductByIdForOwner("p-2", "token-1")

    expect(product).toEqual(makeProduct({ id: "p-2" }))
  })

  it("getProductById rejects with 'Product not found' shape on 404", async () => {
    server.use(
      http.get("*/api/products/:id", () => HttpResponse.json({ message: "Product not found" }, { status: 404 })),
    )

    await expect(productsAPI.getProductById("missing")).rejects.toThrow("Product not found")
  })

  it("getProductByIdForOwner rejects with 403 when the requester is not the owner/admin", async () => {
    server.use(http.get("*/api/products/:id/owner", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })))

    const error = await productsAPI.getProductByIdForOwner("p-1", "token-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(403)
    expect((error as ApiRequestError).authHandled).toBe(false)
  })

  it("rejects on network failure", async () => {
    server.use(http.get("*/api/products/:id", () => HttpResponse.error()))

    await expect(productsAPI.getProductById("p-1")).rejects.toThrow()
  })
})

describe("productsAPI.getUserProducts / getUserProductById contract", () => {
  it("getUserProducts returns a typed array", async () => {
    const products = await productsAPI.getUserProducts("token-1")

    expect(products).toEqual([makeVendorUserProduct()])
  })

  it("getUserProducts tolerates an empty array", async () => {
    server.use(http.get("*/api/user-products", () => HttpResponse.json([])))

    await expect(productsAPI.getUserProducts("token-1")).resolves.toEqual([])
  })

  it("getUserProductById returns the typed detail response", async () => {
    const detail = await productsAPI.getUserProductById("up-1", "token-1")

    expect(detail).toEqual(makeUserProductDetailResponse({ id: "up-1" }))
  })

  it("getUserProductById rejects on 404", async () => {
    server.use(http.get("*/api/user-products/:id", () => HttpResponse.json({ message: "Not found" }, { status: 404 })))

    await expect(productsAPI.getUserProductById("missing", "token-1")).rejects.toThrow("Not found")
  })

  it("getUserProducts rejects on 401 and marks authHandled", async () => {
    server.use(
      http.get("*/api/user-products", () => HttpResponse.json({ message: "Session expired" }, { status: 401 })),
    )

    const error = await productsAPI.getUserProducts("expired").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).authHandled).toBe(true)
  })
})

describe("getFullImageUrl (pure helper)", () => {
  it("returns an empty string for null, undefined, and empty/whitespace input", () => {
    expect(getFullImageUrl(null)).toBe("")
    expect(getFullImageUrl(undefined)).toBe("")
    expect(getFullImageUrl("")).toBe("")
    expect(getFullImageUrl("   ")).toBe("")
  })

  it("passes absolute http(s) URLs through unchanged", () => {
    expect(getFullImageUrl("https://cdn.example.com/x.png")).toBe("https://cdn.example.com/x.png")
    expect(getFullImageUrl("http://cdn.example.com/x.png")).toBe("http://cdn.example.com/x.png")
  })

  it("proxies a relative path without a leading slash", () => {
    expect(getFullImageUrl("uploads/tips.png")).toBe("/api/images/uploads/tips.png")
  })

  it("proxies a relative path with a leading slash", () => {
    expect(getFullImageUrl("/uploads/tips.png")).toBe("/api/images/uploads/tips.png")
  })

  it("normalizes a legacy /api/uploads/... path down to /uploads/...", () => {
    expect(getFullImageUrl("/api/uploads/tips.png")).toBe("/api/images/uploads/tips.png")
  })

  it("trims surrounding whitespace before building the proxy URL", () => {
    expect(getFullImageUrl("  /uploads/tips.png  ")).toBe("/api/images/uploads/tips.png")
  })
})
