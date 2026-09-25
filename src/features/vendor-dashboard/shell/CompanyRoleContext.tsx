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
 * Reads the same `company.me` cache entry as `CompanyInfoCard`, so a company save shows up in the
 * vendor sidebar and welcome header as soon as it resolves, without a reload.
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
