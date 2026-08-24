import type { ApiSavedCard, SetupIntentResponse } from "@/lib/api/payment-methods"
import type { StripeAccountLink, StripeConnectStatus, StripeLoginLink } from "@/lib/api/stripe-connect"

export function makeApiSavedCard(overrides: Partial<ApiSavedCard> = {}): ApiSavedCard {
  return {
    id: "pm-1",
    name: "Main Clinic Card",
    stripeCardId: "pm_1234567890",
    brand: "visa",
    last4: "4532",
    expMonth: 9,
    expYear: 2028,
    isDefault: true,
    openToAutoPayment: true,
    autoOrderCard: true,
    createdDate: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

export function makeSetupIntentResponse(overrides: Partial<SetupIntentResponse> = {}): SetupIntentResponse {
  return {
    setupIntentId: "seti_1234567890",
    clientSecret: "seti_1234567890_secret_abc123",
    ...overrides,
  }
}

export function makeStripeConnectStatus(overrides: Partial<StripeConnectStatus> = {}): StripeConnectStatus {
  return {
    connected: true,
    enabled: true,
    stripeAccountId: "acct_1234567890",
    ...overrides,
  }
}

export function makeStripeAccountLink(overrides: Partial<StripeAccountLink> = {}): StripeAccountLink {
  return {
    stripeAccountId: "acct_1234567890",
    onboardingUrl: "https://connect.stripe.com/setup/acct_1234567890",
    stripeAccountEnabled: false,
    ...overrides,
  }
}

export function makeStripeLoginLink(overrides: Partial<StripeLoginLink> = {}): StripeLoginLink {
  return {
    url: "https://connect.stripe.com/express/acct_1234567890",
    ...overrides,
  }
}
