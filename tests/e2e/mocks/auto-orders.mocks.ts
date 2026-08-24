import { makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories/auto-order.factory"
import type { ApiMock } from "../fixtures/api-mock.fixture"

/** Mirrors src/mocks/handlers/auto-orders.handlers.ts route-for-route. */
export function registerAutoOrdersMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/auto-orders", () => ({ body: makeAutoOrdersResponse() }))

  apiMock.on("PATCH", "/backend-api/auto-orders/:autoOrderId", ({ params }) => ({
    body: makeAutoOrder({ id: params.autoOrderId }),
  }))

  apiMock.on("DELETE", "/backend-api/auto-orders/:autoOrderId", () => ({ status: 204 }))
}
