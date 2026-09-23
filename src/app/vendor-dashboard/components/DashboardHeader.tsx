"use client"

import { useId } from "react"
import SectionHeading from "@/components/layout/SectionHeading"
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
      <SectionHeading
        titleAs="h1"
        variant="technical"
        title="Vendor Dashboard"
        description={
          <>
            {displayName ? (
              <span>
                Welcome back, <span className="font-bold text-text-primary text-xl">{displayName}</span>.{" "}
              </span>
            ) : (
              "Welcome back. "
            )}
            Here&apos;s your business overview.
          </>
        }
      />
    </section>
  )
}

export default DashboardHeader
