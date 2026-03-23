import { useCallback, useState } from "react"

export const useFaqAccordion = (initialId: string | null = null) => {
  const [openId, setOpenId] = useState<string | null>(initialId)

  const toggleItem = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id))
  }, [])

  const isOpen = useCallback(
    (id: string) => {
      return openId === id
    },
    [openId],
  )

  return {
    openId,
    isOpen,
    toggleItem,
  }
}
