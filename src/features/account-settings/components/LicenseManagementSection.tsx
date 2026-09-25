"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, BadgeCheck, Clock3, FileBadge2, Plus, ShieldX, Trash2 } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/Toast"
import usStateList from "@/data/usstate-list.json"
import { type CreateLicensePayload, type License, type LicenseType, licenseAPI } from "@/lib/api/licenses"
import { resolveDentalLicenseStatus } from "@/lib/helpers/dentalLicense"
import { formatPaddedDate } from "@/lib/helpers/format"
import { queryKeys } from "@/lib/query/keys"
import { licensesListOptions } from "@/lib/query/options/licenses"
import { useQueryErrorToast } from "@/lib/query/useQueryErrorToast"
import { cn } from "@/lib/utils"

const US_STATES = usStateList.slice(
  0,
  usStateList.findIndex((state) => state.name === "Alberta"),
)

const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  DEA: "DEA",
  STATE_DENTAL: "State Dental",
}

function formatStateOfLicense(abbreviation: string) {
  const state = US_STATES.find((s) => s.abbreviation === abbreviation)
  return state ? `${state.name} (${state.abbreviation})` : abbreviation
}

function formatExpiration(license: License) {
  const date = new Date(license.year, license.month - 1, license.day)
  return formatPaddedDate(date)
}

function StatusBadge({ license }: { license: License }) {
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
function SummaryBadge({ licenses }: { licenses: License[] }) {
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

const emptyFormData: CreateLicensePayload = {
  licenseType: "STATE_DENTAL",
  stateOfLicense: "",
  licenseNumber: "",
  year: 0,
  month: 0,
  day: 0,
}

type FormErrors = {
  licenseNumber?: string
  stateOfLicense?: string
  expirationDate?: string
}

export default function LicenseManagementSection() {
  const idBase = useId()
  const licenseTypeId = `${idBase}-license-type`
  const stateOfLicenseId = `${idBase}-state`
  const licenseNumberId = `${idBase}-license-number`
  const expirationId = `${idBase}-expiration`
  const formTitleId = `${idBase}-form-title`
  const stateErrorId = `${idBase}-state-error`
  const licenseNumberErrorId = `${idBase}-license-number-error`
  const expirationErrorId = `${idBase}-expiration-error`

  const queryClient = useQueryClient()
  const licensesQuery = useQuery(licensesListOptions())
  const licenses = licensesQuery.data ?? []
  const isLoading = licensesQuery.isPending
  useQueryErrorToast(licensesQuery, () => showToast.error("An error occurred while loading licenses"))

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<CreateLicensePayload>(emptyFormData)
  const [expirationDate, setExpirationDate] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const licenseTypeTriggerRef = useRef<HTMLButtonElement | null>(null)
  const stateOfLicenseTriggerRef = useRef<HTMLButtonElement | null>(null)
  const licenseNumberRef = useRef<HTMLInputElement | null>(null)
  const expirationRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isFormOpen) {
      licenseTypeTriggerRef.current?.focus()
    }
  }, [isFormOpen])

  const handleAddNew = () => {
    setFormData(emptyFormData)
    setExpirationDate("")
    setErrors({})
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setFormData(emptyFormData)
    setExpirationDate("")
    setErrors({})
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: FormErrors = {}
    if (!formData.licenseNumber.trim()) {
      nextErrors.licenseNumber = "License number is required"
    }
    if (formData.licenseType === "STATE_DENTAL" && !formData.stateOfLicense?.trim()) {
      nextErrors.stateOfLicense = "State of license is required"
    }
    if (!expirationDate) {
      nextErrors.expirationDate = "Expiration date is required"
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      if (nextErrors.stateOfLicense) {
        stateOfLicenseTriggerRef.current?.focus()
      } else if (nextErrors.licenseNumber) {
        licenseNumberRef.current?.focus()
      } else if (nextErrors.expirationDate) {
        expirationRef.current?.focus()
      }
      return
    }

    // The native date input always yields "YYYY-MM-DD" once non-empty (checked above), so this
    // split always has exactly 3 parts - the guard is here only to satisfy noUncheckedIndexedAccess.
    const [year, month, day] = expirationDate.split("-").map(Number)
    if (year === undefined || month === undefined || day === undefined) {
      setErrors((prev) => ({ ...prev, expirationDate: "Expiration date is invalid" }))
      return
    }

    setIsSaving(true)
    try {
      const payload: CreateLicensePayload = {
        licenseType: formData.licenseType,
        licenseNumber: formData.licenseNumber.trim(),
        year,
        month,
        day,
        ...(formData.licenseType === "STATE_DENTAL"
          ? { stateOfLicense: formData.stateOfLicense?.trim().toUpperCase() }
          : {}),
      }
      await licenseAPI.createLicense(payload)
      showToast.success("License submitted for review")
      handleCancel()
      await queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all })
    } catch (_error) {
      showToast.error("An error occurred while saving the license")
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!licenseToDelete) return

    setIsDeleting(true)
    try {
      await licenseAPI.deleteLicense(licenseToDelete)
      showToast.success("License deleted successfully")
      setLicenseToDelete(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all })
    } catch (_error) {
      showToast.error("An error occurred while deleting the license")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: static id is a deep-link anchor (#licenses) targeted from CartSummaryPanel/ProductHeroDetails.
    <SurfaceCard
      as="section"
      id="licenses"
      variant="glass"
      className="fade-up scroll-mt-24 overflow-hidden"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <FileBadge2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Professional Licenses</h2>
            <p className="text-sm text-text-muted">Required to buy prescription products. Reviewed by our team.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && <SummaryBadge licenses={licenses} />}
          {!isFormOpen && (
            <Button type="button" size="sm" onClick={handleAddNew} aria-label="Add license">
              <Plus className="h-4 w-4" />
              Add license
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          // biome-ignore lint/a11y/useSemanticElements: a <fieldset> here would imply form controls; this is a non-interactive loading placeholder.
          <div role="group" aria-busy="true" aria-label="Loading licenses" className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : licenses.length === 0 && !isFormOpen ? (
          <div className="rounded-xl border border-dashed border-border-strong p-8 text-center">
            <FileBadge2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">You haven't added a license yet.</p>
            <Button type="button" onClick={handleAddNew} variant="link" size="sm" className="mt-2 h-auto p-0">
              Add your first license
            </Button>
          </div>
        ) : licenses.length > 0 ? (
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
                  <StatusBadge license={license} />
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
                    onClick={() => setLicenseToDelete(license.id)}
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
        ) : null}

        {isFormOpen && (
          <form
            onSubmit={handleSave}
            noValidate
            aria-labelledby={formTitleId}
            className={cn(
              "fade-up space-y-4 rounded-xl border border-brand/30 bg-brand/5 p-4",
              licenses.length > 0 && "mt-4",
            )}
          >
            <h4 id={formTitleId} className="text-sm font-semibold text-text-primary">
              New license
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={licenseTypeId} className="text-text-secondary">
                  License Type
                </Label>
                <Select
                  value={formData.licenseType}
                  onValueChange={(value: LicenseType) =>
                    setFormData({ ...formData, licenseType: value, stateOfLicense: "" })
                  }
                >
                  <SelectTrigger id={licenseTypeId} className="w-full" ref={licenseTypeTriggerRef}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STATE_DENTAL">State Dental</SelectItem>
                    <SelectItem value="DEA">DEA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.licenseType === "STATE_DENTAL" && (
                <div className="space-y-2">
                  <Label htmlFor={stateOfLicenseId} className="text-text-secondary">
                    State of License
                  </Label>
                  <Select
                    value={formData.stateOfLicense || undefined}
                    onValueChange={(value: string) => {
                      setFormData({ ...formData, stateOfLicense: value })
                      setErrors((prev) => ({ ...prev, stateOfLicense: undefined }))
                    }}
                  >
                    <SelectTrigger
                      id={stateOfLicenseId}
                      className="w-full"
                      ref={stateOfLicenseTriggerRef}
                      aria-invalid={Boolean(errors.stateOfLicense) || undefined}
                      aria-describedby={errors.stateOfLicense ? stateErrorId : undefined}
                    >
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.abbreviation} value={state.abbreviation}>
                          {state.name} ({state.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.stateOfLicense && (
                    <p id={stateErrorId} role="alert" className="text-xs text-danger">
                      {errors.stateOfLicense}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={licenseNumberId} className="text-text-secondary">
                  License Number
                </Label>
                <Input
                  id={licenseNumberId}
                  type="text"
                  ref={licenseNumberRef}
                  value={formData.licenseNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, licenseNumber: e.target.value })
                    setErrors((prev) => ({ ...prev, licenseNumber: undefined }))
                  }}
                  placeholder="D123456"
                  aria-invalid={Boolean(errors.licenseNumber) || undefined}
                  aria-describedby={errors.licenseNumber ? licenseNumberErrorId : undefined}
                />
                {errors.licenseNumber && (
                  <p id={licenseNumberErrorId} role="alert" className="text-xs text-danger">
                    {errors.licenseNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={expirationId} className="text-text-secondary">
                  Expiration Date
                </Label>
                <Input
                  id={expirationId}
                  type="date"
                  ref={expirationRef}
                  value={expirationDate}
                  onChange={(e) => {
                    setExpirationDate(e.target.value)
                    setErrors((prev) => ({ ...prev, expirationDate: undefined }))
                  }}
                  aria-invalid={Boolean(errors.expirationDate) || undefined}
                  aria-describedby={errors.expirationDate ? expirationErrorId : undefined}
                />
                {errors.expirationDate && (
                  <p id={expirationErrorId} role="alert" className="text-xs text-danger">
                    {errors.expirationDate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Submitting..." : "Submit for review"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!licenseToDelete}
        onClose={() => setLicenseToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete License"
        description="Are you sure you want to delete this license? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
      />
    </SurfaceCard>
  )
}
