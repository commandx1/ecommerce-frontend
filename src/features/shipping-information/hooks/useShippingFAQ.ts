"use client"

import { useCallback, useState } from "react"

interface UseShippingFAQResult {
  openId: string | null
  toggleItem: (itemId: string) => void
}

export function useShippingFAQ(): UseShippingFAQResult {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggleItem = useCallback((itemId: string) => {
    setOpenId((current) => (current === itemId ? null : itemId))
  }, [])

  return { openId, toggleItem }
}
