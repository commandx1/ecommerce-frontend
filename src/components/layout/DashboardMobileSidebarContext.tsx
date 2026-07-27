"use client"

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react"

interface DashboardMobileSidebarContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const DashboardMobileSidebarContext = createContext<DashboardMobileSidebarContextValue | null>(null)

export function DashboardMobileSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const value = useMemo<DashboardMobileSidebarContextValue>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  )

  return <DashboardMobileSidebarContext.Provider value={value}>{children}</DashboardMobileSidebarContext.Provider>
}

export function useDashboardMobileSidebar() {
  const context = useContext(DashboardMobileSidebarContext)
  if (!context) {
    throw new Error("useDashboardMobileSidebar must be used within a DashboardMobileSidebarProvider")
  }
  return context
}
