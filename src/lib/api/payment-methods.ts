import apiClient from "./client"
import type { SavedPaymentMethod, PaymentMethodType } from "@/features/buyer-dashboard/payment-methods/paymentMethodsData"

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
  createdDate: string
}

interface SavedCardListResponse {
  cards: ApiSavedCard[]
  total: number
}

interface SetupIntentResponse {
  setupIntentId: string
  clientSecret: string
}

interface SaveCardPayload {
  paymentMethodId: string // pm_... from Stripe after confirmCardSetup
  nickname: string
  makeDefault: boolean
}

interface UpdateNicknamePayload {
  nickname: string
}

// ── Mapping ──────────────────────────────────────────────────────────────────

function brandToType(brand: string): PaymentMethodType {
  const lower = brand.toLowerCase()
  if (lower === "visa") return "visa"
  if (lower === "mastercard") return "mastercard"
  if (lower === "amex" || lower === "american express") return "amex"
  return "bank"
}

export function mapApiCard(card: ApiSavedCard): SavedPaymentMethod {
  return {
    id: card.id,
    type: brandToType(card.brand),
    brandLabel: card.brand.charAt(0).toUpperCase() + card.brand.slice(1),
    nickname: card.name,
    last4: card.last4,
    cardholder: "",
    expiryMonth: String(card.expMonth).padStart(2, "0"),
    expiryYear: String(card.expYear),
    billingAddress: "",
    status: card.isDefault ? "default" : "active",
    stripePaymentMethodId: card.stripeCardId,
  }
}

// ── API Client ───────────────────────────────────────────────────────────────

class PaymentMethodsAPI {
  async getSavedCards(): Promise<SavedPaymentMethod[]> {
    const response = await apiClient.get<SavedCardListResponse>("/cards")
    return response.data.cards.map(mapApiCard)
  }

  async createSetupIntent(): Promise<SetupIntentResponse> {
    const response = await apiClient.post<SetupIntentResponse>("/cards/setup-intent")
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
}

export const paymentMethodsAPI = new PaymentMethodsAPI()
