"use client"

import { useAuthHydration } from "@/lib/hooks/useAuthHydration"

/**
 * Client component to ensure auth state is hydrated from cookies
 * This component should be included in the root layout
 */
export default function AuthHydration() {
  useAuthHydration()
  return null
}


