import type {
  PaymentMethodType,
  SavedPaymentMethod,
} from "@/features/buyer-dashboard/payment-methods/paymentMethodsData"
import apiClient from "./client"

// ── API shapes (matches Java DTOs) ──────────────────────────────────────────

export interface ApiSavedCard {
  id: string
  name: string
  stripeCardId: string // stripePaymentMethodId
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
  /** Card was set up with an off-session mandate, so auto orders can charge it. */
  openToAutoPayment: boolean
  /** The buyer's single auto order card. */
  autoOrderCard: boolean
  /** Intentionally unused: the wallet UI has nowhere it shows when a card was added. */
  createdDate: string
}

interface SavedCardListResponse {
  cards: ApiSavedCard[]
  // Intentionally unused: the UI derives the count it displays from `cards.length` (always
  // consistent with the list it just received), so there is nothing this duplicate server count
  // would add.
  total: number
}

export interface SetupIntentResponse {
  setupIntentId: string
  clientSecret: string
}

interface SaveCardPayload {
  paymentMethodId: string // pm_... from Stripe after confirmCardSetup
  nickname: string
  makeDefault: boolean
  /**
   * Must match the flag the SetupIntent was created with — the backend only
   * trusts it once Stripe confirms an off_session mandate.
   */
  openToAutoPayment: boolean
  /** Only accepted together with `openToAutoPayment`; the backend 409s otherwise. */
  autoOrderCard: boolean
}

interface UpdateNicknamePayload {
  nickname: string
}

// ── Mapping ──────────────────────────────────────────────────────────────────

/**
 * `SavedCardResponse` fields are typed as non-null `String`/`Integer` on the backend, but nothing
 * stops a malformed response (a bug, a bad migration, a proxy mangling the body) from sending
 * `null`/missing values on the wire, which JSON has no way to rule out at the type level. Every
 * field read here is defended so one bad card degrades gracefully (an empty label, a blank
 * expiry) instead of throwing inside `.map()` and losing every OTHER card in the wallet too.
 */
function safeString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function brandToType(brand: string): PaymentMethodType {
  const lower = brand.toLowerCase()
  if (lower === "visa") return "visa"
  if (lower === "mastercard") return "mastercard"
  if (lower === "amex" || lower === "american express") return "amex"
  return "bank"
}

export function mapApiCard(card: ApiSavedCard): SavedPaymentMethod {
  const brand = safeString(card.brand)
  return {
    id: safeString(card.id),
    type: brandToType(brand),
    brandLabel: brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "",
    nickname: safeString(card.name),
    last4: safeString(card.last4),
    cardholder: "",
    // A broken/missing expiry renders as a blank half of "MM/YYYY" rather than the literal
    // strings "null" or "undefined" that `String(card.expMonth)` would otherwise produce.
    expiryMonth:
      typeof card.expMonth === "number" && Number.isFinite(card.expMonth) ? String(card.expMonth).padStart(2, "0") : "",
    expiryYear: typeof card.expYear === "number" && Number.isFinite(card.expYear) ? String(card.expYear) : "",
    billingAddress: "",
    status: card.isDefault ? "default" : "active",
    stripePaymentMethodId: card.stripeCardId,
    openToAutoPayment: Boolean(card.openToAutoPayment),
    autoOrderCard: Boolean(card.autoOrderCard),
  }
}

// ── API Client ───────────────────────────────────────────────────────────────

class PaymentMethodsAPI {
  async getSavedCards(): Promise<SavedPaymentMethod[]> {
    const response = await apiClient.get<SavedCardListResponse>("/cards")
    // A missing/null/non-array `cards` field (a broken 200 body) would otherwise throw inside
    // `.map()` and take down the whole wallet page behind a generic "failed to load" toast — see
    // TEST-FINDINGS.md F77/F83 for the same pattern in orders and product listing.
    const cards = Array.isArray(response.data?.cards) ? response.data.cards : []
    return cards.map(mapApiCard)
  }

  /**
   * `openToAutoPayment` is a path segment, not a query param — the backend
   * ignores query strings here. It decides the Stripe mandate (off_session vs
   * on_session) and must match what is later sent to `saveCard`.
   */
  async createSetupIntent(openToAutoPayment: boolean): Promise<SetupIntentResponse> {
    const response = await apiClient.post<SetupIntentResponse>(`/cards/setup-intent/${openToAutoPayment}`)
    return response.data
  }

  async saveCard(payload: SaveCardPayload): Promise<SavedPaymentMethod> {
    const response = await apiClient.post<ApiSavedCard>("/cards", payload)
    return mapApiCard(response.data)
  }

  async deleteCard(cardId: string): Promise<void> {
    await apiClient.delete(`/cards/${cardId}`)
  }

  async updateNickname(cardId: string, payload: UpdateNicknamePayload): Promise<SavedPaymentMethod> {
    const response = await apiClient.patch<ApiSavedCard>(`/cards/${cardId}/nickname`, payload)
    return mapApiCard(response.data)
  }

  async setDefault(cardId: string): Promise<SavedPaymentMethod> {
    const response = await apiClient.patch<ApiSavedCard>(`/cards/${cardId}/default`)
    return mapApiCard(response.data)
  }

  /**
   * Promote a card to be the buyer's single auto order card, or drop that
   * designation. Dropping it (or promoting a different card away from this one)
   * pauses every standing auto order, so callers must confirm first.
   */
  async setAutoOrderCard(cardId: string, autoOrderCard: boolean): Promise<SavedPaymentMethod> {
    const response = await apiClient.patch<ApiSavedCard>(`/cards/${cardId}/auto-order-card`, { autoOrderCard })
    return mapApiCard(response.data)
  }

  /**
   * Step 1 of upgrading an already-saved card to an off-session mandate. No
   * charge happens; the client must confirm the returned clientSecret with
   * Stripe (which may prompt for 3D Secure) before calling `confirmAutoPaymentUpgrade`.
   */
  async createAutoPaymentUpgradeSetupIntent(cardId: string): Promise<SetupIntentResponse> {
    const response = await apiClient.post<SetupIntentResponse>(`/cards/${cardId}/auto-payment-upgrade/setup-intent`)
    return response.data
  }

  /**
   * Step 2: report the confirmed SetupIntent back, in case the
   * `setup_intent.succeeded` webhook is delayed. The backend re-verifies it
   * with Stripe before flipping `openToAutoPayment`.
   */
  async confirmAutoPaymentUpgrade(cardId: string, setupIntentId: string): Promise<SavedPaymentMethod> {
    const response = await apiClient.post<ApiSavedCard>(`/cards/${cardId}/auto-payment-upgrade/confirm`, {
      setupIntentId,
    })
    return mapApiCard(response.data)
  }
}

export const paymentMethodsAPI = new PaymentMethodsAPI()
