"use client"

import { useId } from "react"
import { useAuthStore } from "@/stores/authStore"
import { useCompanyRole } from "../CompanyRoleContext"

const DashboardHeader = () => {
  const sectionId = useId()
  const { companyName } = useCompanyRole()
  const user = useAuthStore((state) => state.user)

  const userName = user ? `${user.name} ${user.surname}`.trim() || user.email : ""
  const displayName = companyName ?? userName

  return (
    <section id={sectionId} className="mb-8">
      <h1 className="text-3xl font-bold text-text-primary">Vendor Dashboard</h1>
      <p className="mt-3 text-text-secondary">
        {displayName ? (
          <span>
            Welcome back, <span className="font-bold text-text-primary text-xl">{displayName}</span>.{" "}
          </span>
        ) : (
          "Welcome back. "
        )}
        Here&apos;s your business overview.
      </p>
    </section>
  )
}

export default DashboardHeader
