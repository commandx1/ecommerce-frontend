import {
  makeApiSavedCard,
  makeSetupIntentResponse,
  makeStripeAccountLink,
  makeStripeConnectStatus,
  makeStripeLoginLink,
} from "@/test/factories/payment.factory"
import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * Mirrors src/mocks/handlers/payments.handlers.ts, EXCEPT:
 *  - `GET /backend-api/cards` - wrapped in `{ cards: [...], total: 1 }`
 *    literally in the handler file, no exported wrapper factory. See the
 *    Faz 8.1 infra report's "missing exports" list.
 *  - `POST /backend-api/invoices` - returns a raw PDF `Blob`, not JSON; the
 *    current `apiMock.on` JSON-body contract can't represent that faithfully
 *    without misrepresenting the response (flagged as a follow-up, not
 *    silently approximated).
 */
export function registerPaymentsMocks(apiMock: ApiMock) {
  apiMock.on("POST", "/backend-api/cards/setup-intent/:openToAutoPayment", () => ({
    body: makeSetupIntentResponse(),
  }))
  apiMock.on("POST", "/backend-api/cards", () => ({ body: makeApiSavedCard() }))
  apiMock.on("DELETE", "/backend-api/cards/:cardId", () => ({ status: 200 }))
  apiMock.on("PATCH", "/backend-api/cards/:cardId/nickname", ({ params }) => ({
    body: makeApiSavedCard({ id: params.cardId }),
  }))
  apiMock.on("PATCH", "/backend-api/cards/:cardId/default", ({ params }) => ({
    body: makeApiSavedCard({ id: params.cardId, isDefault: true }),
  }))
  apiMock.on("PATCH", "/backend-api/cards/:cardId/auto-order-card", ({ params }) => ({
    body: makeApiSavedCard({ id: params.cardId, autoOrderCard: true }),
  }))
  apiMock.on("POST", "/backend-api/cards/:cardId/auto-payment-upgrade/setup-intent", () => ({
    body: makeSetupIntentResponse(),
  }))
  apiMock.on("POST", "/backend-api/cards/:cardId/auto-payment-upgrade/confirm", ({ params }) => ({
    body: makeApiSavedCard({ id: params.cardId, openToAutoPayment: true }),
  }))

  apiMock.on("GET", "/backend-api/stripe/connect/status", () => ({ body: makeStripeConnectStatus() }))
  apiMock.on("POST", "/backend-api/stripe/connect/account", () => ({ body: makeStripeAccountLink() }))
  apiMock.on("GET", "/backend-api/stripe/connect/login-link", () => ({ body: makeStripeLoginLink() }))
}
