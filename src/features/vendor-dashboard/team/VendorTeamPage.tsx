"use client"

import NoticeBanner from "@/components/feedback/NoticeBanner"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompanyRole } from "@/features/vendor-dashboard/shell/CompanyRoleContext"
import InviteMemberForm from "./components/InviteMemberForm"
import { useInviteMemberForm } from "./hooks/useInviteMemberForm"

export default function VendorTeamPage() {
  const { companyRole, isLoading } = useCompanyRole()
  const inviteForm = useInviteMemberForm()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <SurfaceCard variant="glass" className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-11 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-2xl" />
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        </SurfaceCard>
      </div>
    )
  }

  if (companyRole !== "OWNER") {
    return (
      <>
        <section className="mb-8">
          <SectionHeading
            titleAs="h1"
            variant="technical"
            title="Team"
            description="Invite people to join your company."
          />
        </section>
        <NoticeBanner
          tone="warning"
          title="Owner access required"
          description="Only the company OWNER can invite team members. Ask your company owner to send invitations."
        />
      </>
    )
  }

  return (
    <>
      <section className="mb-8">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Team"
          description="Invite managers and members to join your company."
        />
      </section>

      <InviteMemberForm {...inviteForm} />
    </>
  )
}
