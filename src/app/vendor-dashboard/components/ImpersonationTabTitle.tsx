"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { useAuthStore } from "@/stores/authStore"
import { useCompanyRole } from "../CompanyRoleContext"

export default function ImpersonationTabTitle() {
  const { companyName } = useCompanyRole()
  const user = useAuthStore((s) => s.user)
  const isAdminImpersonating = useAuthStore((s) => s.isAdminImpersonating)
  const pathname = usePathname()

  useEffect(() => {
    if (!isAdminImpersonating) return
    const fullName = user ? `${user.name} ${user.surname}`.trim() : ""
    const title = [companyName, fullName].filter(Boolean).join(" - ")
    if (!title) return
    document.title = title
    // Next.js re-applies the page's <title> from metadata on every client navigation,
    // and this effect runs after that commit, so pathname is a dep to keep our title winning.
  }, [isAdminImpersonating, companyName, user, pathname])

  return null
}
