"use client"

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { type CompanyRole, getMyCompany } from "@/lib/api/company"

interface CompanyRoleContextValue {
  companyRole: CompanyRole | null
  companyName: string | null
  isLoading: boolean
}

const CompanyRoleContext = createContext<CompanyRoleContextValue | null>(null)

export function CompanyRoleProvider({ children }: { children: ReactNode }) {
  const [companyRole, setCompanyRole] = useState<CompanyRole | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getMyCompany()
      .then((company) => {
        if (controller.signal.aborted) return
        setCompanyRole(company.companyRole)
        setCompanyName(company.name?.trim() || null)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setCompanyRole(null)
        setCompanyName(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  const value = useMemo<CompanyRoleContextValue>(
    () => ({ companyRole, companyName, isLoading }),
    [companyRole, companyName, isLoading],
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
