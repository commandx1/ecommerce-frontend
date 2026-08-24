import { HttpResponse, http } from "msw"
import {
  makeApiSavedCard,
  makeSetupIntentResponse,
  makeStripeAccountLink,
  makeStripeConnectStatus,
  makeStripeLoginLink,
} from "@/test/factories/payment.factory"

export const paymentsHandlers = [
  // ==================== Payment methods ====================
  http.get("*/backend-api/cards", () => HttpResponse.json({ cards: [makeApiSavedCard()], total: 1 })),

  http.post("*/backend-api/cards/setup-intent/:openToAutoPayment", () => HttpResponse.json(makeSetupIntentResponse())),

  http.post("*/backend-api/cards", () => HttpResponse.json(makeApiSavedCard())),

  http.delete("*/backend-api/cards/:cardId", () => new HttpResponse(null, { status: 200 })),

  http.patch("*/backend-api/cards/:cardId/nickname", ({ params }) =>
    HttpResponse.json(makeApiSavedCard({ id: String(params.cardId) })),
  ),

  http.patch("*/backend-api/cards/:cardId/default", ({ params }) =>
    HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), isDefault: true })),
  ),

  http.patch("*/backend-api/cards/:cardId/auto-order-card", ({ params }) =>
    HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), autoOrderCard: true })),
  ),

  http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/setup-intent", () =>
    HttpResponse.json(makeSetupIntentResponse()),
  ),

  http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/confirm", ({ params }) =>
    HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), openToAutoPayment: true })),
  ),

  // ==================== Stripe Connect (vendor payouts) ====================
  http.get("*/backend-api/stripe/connect/status", () => HttpResponse.json(makeStripeConnectStatus())),

  http.post("*/backend-api/stripe/connect/account", () => HttpResponse.json(makeStripeAccountLink())),

  http.get("*/backend-api/stripe/connect/login-link", () => HttpResponse.json(makeStripeLoginLink())),

  // ==================== Invoices ====================
  http.post(
    "*/backend-api/invoices",
    () =>
      new HttpResponse(new Blob(["%PDF-1.4 mock invoice"], { type: "application/pdf" }), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="invoice-order-1.pdf"',
        },
      }),
  ),
]
