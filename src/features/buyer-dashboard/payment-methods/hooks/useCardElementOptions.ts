"use client"

import { useTheme } from "next-themes"
import { useEffect, useMemo, useState } from "react"

/**
 * Stripe `CardNumberElement` style options, mirroring checkout's styling (Phase 4 §7, B2b).
 * `mounted` avoids an SSR/first-paint theme mismatch: `resolvedTheme` is undefined until the
 * theme provider hydrates, so the element would otherwise flash light-mode colors on a dark
 * session for one render.
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
