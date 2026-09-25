"use client"

import { AlertCircle, FileBadge2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { License } from "@/lib/api/licenses"
import { cn } from "@/lib/utils"
import { formatExpiration, formatStateOfLicense, LICENSE_TYPE_LABELS } from "../lib/license-format"
import { LicenseStatusBadge } from "./license-status-badge"

interface LicenseListProps {
  licenses: License[]
  isLoading: boolean
  isFormOpen: boolean
  onAddFirst: () => void
  onRequestDelete: (licenseId: string) => void
}

/** Loading skeleton, empty state, or the license cards themselves — whichever applies. */
export default function LicenseList({
  licenses,
  isLoading,
  isFormOpen,
  onAddFirst,
  onRequestDelete,
}: LicenseListProps) {
  if (isLoading) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a <fieldset> here would imply form controls; this is a non-interactive loading placeholder.
      <div role="group" aria-busy="true" aria-label="Loading licenses" className="space-y-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  if (licenses.length === 0 && !isFormOpen) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-8 text-center">
        <FileBadge2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm text-text-secondary">You haven't added a license yet.</p>
        <Button type="button" onClick={onAddFirst} variant="link" size="sm" className="mt-2 h-auto p-0">
          Add your first license
        </Button>
      </div>
    )
  }

  if (licenses.length === 0) return null

  return (
    <ul className="space-y-3">
      {licenses.map((license) => (
        <li
          key={license.id}
          className={cn(
            "rounded-xl border p-4",
            license.approved === false ? "border-danger/30" : "border-border-soft",
          )}
        >
          <div className="grid grid-cols-1 justify-items-start gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-1">
              <p className="text-sm text-text-primary">
                <span className="font-semibold text-text-secondary">License Type:</span>{" "}
                {LICENSE_TYPE_LABELS[license.licenseType]}
              </p>
              {license.stateOfLicense && (
                <p className="text-sm text-text-primary">
                  <span className="font-semibold text-text-secondary">State:</span>{" "}
                  {formatStateOfLicense(license.stateOfLicense)}
                </p>
              )}
              <p className="text-sm text-text-primary">
                <span className="font-semibold text-text-secondary">License Number:</span> {license.licenseNumber}
              </p>
            </div>
            <LicenseStatusBadge license={license} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-3">
            <p className={cn("text-xs", license.expired ? "font-semibold text-danger" : "text-text-muted")}>
              {license.expired ? "Expired " : "Expires "}
              {formatExpiration(license)}
            </p>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => onRequestDelete(license.id)}
              className="h-auto p-0 text-sm font-medium text-danger"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
          {license.approved === false && license.rejectDescription && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-danger/5 p-2.5 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {license.rejectDescription}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
