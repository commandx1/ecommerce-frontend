import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeFavoriteProductItem } from "@/test/factories/product.factory"
import {
  addProductFavorite,
  getMyFavoriteProductIds,
  getMyFavoriteProducts,
  removeProductFavorite,
} from "./favorite-products"
import { ApiRequestError } from "./request"

const favoriteItem = makeFavoriteProductItem()

beforeEach(() => {
  server.use(
    http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(["p-1", "p-2"])),
    http.get("*/backend-api/products/favorites", () => HttpResponse.json([favoriteItem])),
    http.post("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 200 })),
    http.delete("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 200 })),
  )
})

describe("addProductFavorite / removeProductFavorite request shape contract", () => {
  it("sends a POST to /products/:productId/favorite", async () => {
    let captured: { method: string; url: string } | null = null
    server.use(
      http.post("*/backend-api/products/:productId/favorite", ({ request }) => {
        captured = { method: request.method, url: new URL(request.url).pathname }
        return new HttpResponse(null, { status: 200 })
      }),
    )

    await addProductFavorite("p-1")

    expect(captured).toEqual({ method: "POST", url: "/backend-api/products/p-1/favorite" })
  })

  it("sends a DELETE to the same /products/:productId/favorite path", async () => {
    let captured: { method: string; url: string } | null = null
    server.use(
      http.delete("*/backend-api/products/:productId/favorite", ({ request }) => {
        captured = { method: request.method, url: new URL(request.url).pathname }
        return new HttpResponse(null, { status: 200 })
      }),
    )

    await removeProductFavorite("p-1")

    expect(captured).toEqual({ method: "DELETE", url: "/backend-api/products/p-1/favorite" })
  })

  it("URL-encodes a product id containing special characters", async () => {
    let captured: string | null = null
    server.use(
      http.post("*/backend-api/products/:productId/favorite", ({ request }) => {
        captured = new URL(request.url).pathname
        return new HttpResponse(null, { status: 200 })
      }),
    )

    await addProductFavorite("p/1 &2")

    expect(captured).toBe(`/backend-api/products/${encodeURIComponent("p/1 &2")}/favorite`)
  })
})

describe("getMyFavoriteProductIds malformed-200 contract", () => {
  it.each([
    ["an object", { nope: true }],
    ["a string", "not-a-list"],
    ["a number", 7],
    ["null", null],
  ])("%s in place of the list degrades to an empty array", async (_label, body) => {
    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(body)))

    await expect(getMyFavoriteProductIds()).resolves.toEqual([])
  })

  it("returns the favorite id list on the happy path", async () => {
    await expect(getMyFavoriteProductIds()).resolves.toEqual(["p-1", "p-2"])
  })
})

describe("getMyFavoriteProducts malformed-200 contract", () => {
  it.each([
    ["an object", { nope: true }],
    ["a string", "not-a-list"],
    ["a number", 7],
    ["null", null],
  ])("%s in place of the list degrades to an empty array", async (_label, body) => {
    server.use(http.get("*/backend-api/products/favorites", () => HttpResponse.json(body)))

    await expect(getMyFavoriteProducts()).resolves.toEqual([])
  })

  it("returns the typed favorite product list on the happy path", async () => {
    await expect(getMyFavoriteProducts()).resolves.toEqual([favoriteItem])
  })
})

describe("favorite-products adversarial contract", () => {
  it("rejects addProductFavorite with an ApiRequestError carrying the 404 status and backend message", async () => {
    server.use(
      http.post("*/backend-api/products/:productId/favorite", () =>
        HttpResponse.json(
          { timestamp: "2026-09-11T00:00:00Z", message: "Product not found: p-9", status: 404 },
          { status: 404 },
        ),
      ),
    )

    const error = await addProductFavorite("p-9").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(404)
    expect(error.message).toBe("Product not found: p-9")
  })

  it("rejects getMyFavoriteProducts with a 403", async () => {
    server.use(
      http.get("*/backend-api/products/favorites", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })),
    )

    const error = await getMyFavoriteProducts().catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(403)
  })
})
