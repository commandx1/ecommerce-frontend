"use client"

import { useTheme } from "next-themes"
import { useEffect, useMemo, useState } from "react"

/**
 * Stripe `CardNumberElement` style options, matching checkout. `mounted` avoids a first-paint theme
 * mismatch: `resolvedTheme` is undefined until the provider hydrates.
 */
export function useCardElementOptions() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return useMemo(
    () => ({
      disableLink: true,
      style: {
        base: {
          fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
          fontSize: "16px",
          color: isDark ? "#F4F1EA" : "#1F2937",
          iconColor: isDark ? "#F4F1EA" : "#475569",
          "::placeholder": { color: isDark ? "#A8B0BD" : "#94A3B8" },
        },
        invalid: { color: "#DC2626", iconColor: "#DC2626" },
      },
    }),
    [isDark],
  )
}
