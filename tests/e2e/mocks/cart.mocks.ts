import { makeCart, makeTaxEstimate } from "@/test/factories/cart.factory"
import type { ApiMock } from "../fixtures/api-mock.fixture"

/** Mirrors src/mocks/handlers/cart.handlers.ts route-for-route. */
export function registerCartMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/cart", () => ({ body: makeCart() }))
  apiMock.on("POST", "/backend-api/cart/tax-estimate", () => ({ body: makeTaxEstimate() }))
  apiMock.on("POST", "/backend-api/cart/items", () => ({ status: 200 }))
  apiMock.on("PUT", "/backend-api/cart/items", () => ({ status: 200 }))
  apiMock.on("DELETE", "/backend-api/cart/items", () => ({ status: 200 }))
  apiMock.on("DELETE", "/backend-api/cart", () => ({ status: 200 }))
}
