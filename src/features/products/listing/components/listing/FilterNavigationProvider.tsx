"use client"

import { FilterNavigationContext, useFilterNavigationProvider } from "../../hooks/useProductFiltersNavigation"

export default function FilterNavigationProvider({ children }: { children: React.ReactNode }) {
  const value = useFilterNavigationProvider()
  return <FilterNavigationContext.Provider value={value}>{children}</FilterNavigationContext.Provider>
}
