import { HttpResponse, http } from "msw"
import { makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories/auto-order.factory"

export const autoOrdersHandlers = [
  http.get("*/backend-api/auto-orders", () => HttpResponse.json(makeAutoOrdersResponse())),

  http.patch("*/backend-api/auto-orders/:autoOrderId", ({ params }) =>
    HttpResponse.json(makeAutoOrder({ id: String(params.autoOrderId) })),
  ),

  http.delete("*/backend-api/auto-orders/:autoOrderId", () => new HttpResponse(null, { status: 204 })),
]
