import { HttpResponse, http } from "msw"
import { makeCart, makeTaxEstimate } from "@/test/factories/cart.factory"

export const cartHandlers = [
  http.get("*/backend-api/cart", () => HttpResponse.json(makeCart())),

  http.post("*/backend-api/cart/tax-estimate", () => HttpResponse.json(makeTaxEstimate())),

  http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),

  http.put("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),

  http.delete("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),

  http.delete("*/backend-api/cart", () => new HttpResponse(null, { status: 200 })),
]
