"use client"

import { AlertCircle, BadgeCheck, Clock3, FileBadge2, ShieldX } from "lucide-react"
import type { License } from "@/lib/api/licenses"
import { resolveDentalLicenseStatus } from "@/lib/helpers/dentalLicense"

export function LicenseStatusBadge({ license }: { license: License }) {
  if (license.approved === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-success">
        <BadgeCheck className="h-3.5 w-3.5" />
        Approved
      </span>
    )
  }
  if (license.approved === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-danger">
        <ShieldX className="h-3.5 w-3.5" />
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-warning">
      <Clock3 className="h-3.5 w-3.5" />
      Pending
    </span>
  )
}

// Mirrors `resolveDentalLicenseStatus` to summarise all of a buyer's licenses into the single
// most actionable status pill shown in the section header.
export function LicenseSummaryBadge({ licenses }: { licenses: License[] }) {
  const status = resolveDentalLicenseStatus(licenses)

  if (status === "valid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-success">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified
      </span>
    )
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-warning">
        <Clock3 className="h-3.5 w-3.5" />
        Pending review
      </span>
    )
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-danger">
        <AlertCircle className="h-3.5 w-3.5" />
        Expired
      </span>
    )
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-danger">
        <ShieldX className="h-3.5 w-3.5" />
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
      <FileBadge2 className="h-3.5 w-3.5" />
      No license on file
    </span>
  )
}
