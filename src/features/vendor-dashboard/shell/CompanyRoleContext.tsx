"use client"

import { useQuery } from "@tanstack/react-query"
import { createContext, type ReactNode, useContext, useMemo } from "react"
import type { CompanyRole } from "@/lib/api/company"
import { companyMeOptions } from "@/lib/query/options/company"

interface CompanyRoleContextValue {
  companyRole: CompanyRole | null
  companyName: string | null
  isLoading: boolean
}

const CompanyRoleContext = createContext<CompanyRoleContextValue | null>(null)

/**
 * Reads the same `company.me` cache entry as `CompanyInfoCard` (Phase 4 §2.1/K0, C3b/D1): a
 * company save writes that entry directly, so the vendor sidebar and welcome header pick up the
 * new name as soon as the save resolves, without waiting for a reload. `staleTime`/`gcTime: 0`
 * (§2.2) means this still issues its own GET on every mount, same request count as before.
 */
export function CompanyRoleProvider({ children }: { children: ReactNode }) {
  const companyQuery = useQuery(companyMeOptions())
  const company = companyQuery.data ?? null

  const value = useMemo<CompanyRoleContextValue>(
    () => ({
      companyRole: company?.companyRole ?? null,
      companyName: company?.name?.trim() || null,
      isLoading: companyQuery.isPending,
    }),
    [company, companyQuery.isPending],
  )

  return <CompanyRoleContext.Provider value={value}>{children}</CompanyRoleContext.Provider>
}

export function useCompanyRole() {
  const context = useContext(CompanyRoleContext)
  if (!context) {
    throw new Error("useCompanyRole must be used within a CompanyRoleProvider")
  }
  return context
}
