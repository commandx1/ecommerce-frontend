"use client"

import { createContext, useContext } from "react"

const StripeConfigContext = createContext<{ publishableKey: string }>({ publishableKey: "" })

export function StripeConfigProvider({
  publishableKey,
  children,
}: {
  publishableKey: string
  children: React.ReactNode
}) {
  return <StripeConfigContext.Provider value={{ publishableKey }}>{children}</StripeConfigContext.Provider>
}

export function useStripePublishableKey(): string {
  const { publishableKey } = useContext(StripeConfigContext)
  return publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
}
