"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { FileBadge2, Plus } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import { Button } from "@/components/ui/button"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { showToast } from "@/components/ui/Toast"
import { type CreateLicensePayload, licenseAPI } from "@/lib/api/licenses"
import { queryKeys } from "@/lib/query/keys"
import { licensesListOptions } from "@/lib/query/options/licenses"
import { useQueryErrorToast } from "@/lib/query/useQueryErrorToast"
import LicenseForm, { type LicenseFormErrors } from "./license-form"
import LicenseList from "./license-list"
import { LicenseSummaryBadge } from "./license-status-badge"

const emptyFormData: CreateLicensePayload = {
  licenseType: "STATE_DENTAL",
  stateOfLicense: "",
  licenseNumber: "",
  year: 0,
  month: 0,
  day: 0,
}

export default function LicenseManagementSection() {
  const idBase = useId()
  const formIds = {
    licenseTypeId: `${idBase}-license-type`,
    stateOfLicenseId: `${idBase}-state`,
    licenseNumberId: `${idBase}-license-number`,
    expirationId: `${idBase}-expiration`,
    formTitleId: `${idBase}-form-title`,
    stateErrorId: `${idBase}-state-error`,
    licenseNumberErrorId: `${idBase}-license-number-error`,
    expirationErrorId: `${idBase}-expiration-error`,
  }

  const queryClient = useQueryClient()
  const licensesQuery = useQuery(licensesListOptions())
  const licenses = licensesQuery.data ?? []
  const isLoading = licensesQuery.isPending
  useQueryErrorToast(licensesQuery, () => showToast.error("An error occurred while loading licenses"))

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<CreateLicensePayload>(emptyFormData)
  const [expirationDate, setExpirationDate] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<LicenseFormErrors>({})

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

  const clearFormError = (field: keyof LicenseFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: LicenseFormErrors = {}
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
          {!isLoading && <LicenseSummaryBadge licenses={licenses} />}
          {!isFormOpen && (
            <Button type="button" size="sm" onClick={handleAddNew} aria-label="Add license">
              <Plus className="h-4 w-4" />
              Add license
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        <LicenseList
          licenses={licenses}
          isLoading={isLoading}
          isFormOpen={isFormOpen}
          onAddFirst={handleAddNew}
          onRequestDelete={setLicenseToDelete}
        />

        {isFormOpen && (
          <LicenseForm
            ids={formIds}
            hasExistingLicenses={licenses.length > 0}
            formData={formData}
            expirationDate={expirationDate}
            errors={errors}
            isSaving={isSaving}
            licenseTypeTriggerRef={licenseTypeTriggerRef}
            stateOfLicenseTriggerRef={stateOfLicenseTriggerRef}
            licenseNumberRef={licenseNumberRef}
            expirationRef={expirationRef}
            onFormDataChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            onExpirationDateChange={setExpirationDate}
            onClearError={clearFormError}
            onSubmit={(e) => void handleSave(e)}
            onCancel={handleCancel}
          />
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
