"use client"

import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { useMemo } from "react"
import { useStripePublishableKey } from "@/components/providers/StripeConfigProvider"

const stripePromiseCache = new Map<string, Promise<Stripe | null>>()

export function useStripePromise(): Promise<Stripe | null> | null {
  const publishableKey = useStripePublishableKey()

  return useMemo(() => {
    if (!publishableKey) {
      return null
    }

    if (!stripePromiseCache.has(publishableKey)) {
      stripePromiseCache.set(publishableKey, loadStripe(publishableKey))
    }

    return stripePromiseCache.get(publishableKey) ?? null
  }, [publishableKey])
}
