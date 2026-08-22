import { apiRequest } from "@/lib/api/request"

export interface StripeConnectStatus {
  /** A Stripe account exists for the vendor's company. */
  connected: boolean
  /** Onboarding is complete — charges and payouts are both enabled. */
  enabled: boolean
  stripeAccountId: string | null
}

export interface StripeAccountLink {
  stripeAccountId: string
  /** Hosted Stripe onboarding URL the vendor must complete. */
  onboardingUrl: string
  stripeAccountEnabled: boolean
}

export interface StripeLoginLink {
  url: string
}

export async function getStripeConnectStatus(): Promise<StripeConnectStatus> {
  return apiRequest.requestJson<StripeConnectStatus>({
    client: "backend",
    method: "GET",
    url: "/stripe/connect/status",
    fallbackMessage: "Failed to fetch payout account status",
  })
}

/** Creates the Stripe account when missing and always returns a fresh onboarding link. */
export async function createStripeAccountLink(): Promise<StripeAccountLink> {
  return apiRequest.requestJson<StripeAccountLink>({
    client: "backend",
    method: "POST",
    url: "/stripe/connect/account",
    fallbackMessage: "Failed to start payout account setup",
  })
}

export async function getStripeLoginLink(): Promise<StripeLoginLink> {
  return apiRequest.requestJson<StripeLoginLink>({
    client: "backend",
    method: "GET",
    url: "/stripe/connect/login-link",
    fallbackMessage: "Failed to open the Stripe dashboard",
  })
}
