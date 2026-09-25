"use client"

import type { RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CreateLicensePayload, LicenseType } from "@/lib/api/licenses"
import { cn } from "@/lib/utils"
import { US_STATES } from "../lib/license-format"

export interface LicenseFormErrors {
  licenseNumber?: string
  stateOfLicense?: string
  expirationDate?: string
}

interface LicenseFormIds {
  licenseTypeId: string
  stateOfLicenseId: string
  licenseNumberId: string
  expirationId: string
  formTitleId: string
  stateErrorId: string
  licenseNumberErrorId: string
  expirationErrorId: string
}

interface LicenseFormProps {
  ids: LicenseFormIds
  hasExistingLicenses: boolean
  formData: CreateLicensePayload
  expirationDate: string
  errors: LicenseFormErrors
  isSaving: boolean
  licenseTypeTriggerRef: RefObject<HTMLButtonElement | null>
  stateOfLicenseTriggerRef: RefObject<HTMLButtonElement | null>
  licenseNumberRef: RefObject<HTMLInputElement | null>
  expirationRef: RefObject<HTMLInputElement | null>
  onFormDataChange: (patch: Partial<CreateLicensePayload>) => void
  onExpirationDateChange: (value: string) => void
  onClearError: (field: keyof LicenseFormErrors) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

/** The "add a license" form: license type, state (state-dental only), number, and expiration. */
export default function LicenseForm({
  ids,
  hasExistingLicenses,
  formData,
  expirationDate,
  errors,
  isSaving,
  licenseTypeTriggerRef,
  stateOfLicenseTriggerRef,
  licenseNumberRef,
  expirationRef,
  onFormDataChange,
  onExpirationDateChange,
  onClearError,
  onSubmit,
  onCancel,
}: LicenseFormProps) {
  const {
    licenseTypeId,
    stateOfLicenseId,
    licenseNumberId,
    expirationId,
    formTitleId,
    stateErrorId,
    licenseNumberErrorId,
    expirationErrorId,
  } = ids

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby={formTitleId}
      className={cn(
        "fade-up space-y-4 rounded-xl border border-brand/30 bg-brand/5 p-4",
        hasExistingLicenses && "mt-4",
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
            onValueChange={(value: LicenseType) => onFormDataChange({ licenseType: value, stateOfLicense: "" })}
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
                onFormDataChange({ stateOfLicense: value })
                onClearError("stateOfLicense")
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
              onFormDataChange({ licenseNumber: e.target.value })
              onClearError("licenseNumber")
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
              onExpirationDateChange(e.target.value)
              onClearError("expirationDate")
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Submitting..." : "Submit for review"}
        </Button>
      </div>
    </form>
  )
}
