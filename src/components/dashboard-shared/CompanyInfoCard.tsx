"use client"

import { Building2, Globe, Mail, Phone, Save } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useId, useState } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SurfaceCard from "@/components/ui/SurfaceCard"
import Skeleton from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/Toast"
import { Textarea } from "@/components/ui/textarea"
import {
  type CompanyProfile,
  getMyCompany,
  SHIPMENT_POLICY_DAYS,
  type ShipmentPolicy,
  shipmentPolicyLabel,
  type UpdateCompanyPayload,
  updateMyCompany,
} from "@/lib/api/company"
import { ApiRequestError } from "@/lib/api/request"
import { cn, isHttpUrl } from "@/lib/utils"

/** Statuses that mean "no company data to show" rather than a real failure. */
const EMPTY_STATE_STATUSES = new Set([404, 501])

const DESCRIPTION_MAX_LENGTH = 2000

/** Same as UpdateCompanyPayload, but shipmentPolicy can be "" (unset) to bind a native <select>. */
type CompanyFormState = Omit<UpdateCompanyPayload, "shipmentPolicy"> & { shipmentPolicy: ShipmentPolicy | "" }

const toFormState = (company: CompanyProfile): CompanyFormState => ({
  name: company.name || "",
  companyPhoto: company.companyPhoto || "",
  taxNumber: company.taxNumber || "",
  email: company.email || "",
  phoneNumber: company.phoneNumber || "",
  website: company.website || "",
  description: company.description || "",
  // Entity default is true; if an older API build omits the field, the box must not silently
  // flip to false on save.
  uberEnabled: company.uberEnabled ?? true,
  shipmentPolicy: company.shipmentPolicy ?? "",
})

export default function CompanyInfoCard() {
  const idBase = useId()
  const nameId = `${idBase}-company-name`
  const taxNumberId = `${idBase}-tax-number`
  const emailId = `${idBase}-company-email`
  const phoneId = `${idBase}-company-phone`
  const websiteId = `${idBase}-company-website`
  const descriptionId = `${idBase}-company-description`
  const logoId = `${idBase}-company-logo`
  const uberEnabledId = `${idBase}-uber-enabled`
  const shipmentPolicyId = `${idBase}-shipment-policy`

  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [formData, setFormData] = useState<CompanyFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  const loadCompany = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    setIsUnavailable(false)

    try {
      const data = await getMyCompany()
      setCompany(data)
      setFormData(toFormState(data))
      setLogoFailed(false)
    } catch (error) {
      const status = error instanceof ApiRequestError ? error.status : undefined

      if (status !== undefined && EMPTY_STATE_STATUSES.has(status)) {
        setIsUnavailable(true)
      } else {
        setLoadError(error instanceof Error ? error.message : "Failed to load company information.")
      }

      setCompany(null)
      setFormData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompany()
  }, [loadCompany])

  const canEdit = company?.companyRole === "OWNER"

  const handleFieldChange = (field: keyof CompanyFormState, value: string | boolean) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev))
    if (field === "companyPhoto") {
      setLogoFailed(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData || !canEdit) return

    setIsSaving(true)

    try {
      const updated = await updateMyCompany({ ...formData, shipmentPolicy: formData.shipmentPolicy || null })
      setCompany(updated)
      setFormData(toFormState(updated))
      showToast.success("Company information updated successfully!")
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Failed to update company information.")
    } finally {
      setIsSaving(false)
    }
  }

  const createdOn = company?.createdDate
    ? new Date(company.createdDate).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : null

  return (
    <SurfaceCard as="section" variant="glass" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Building2 className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold text-text-primary">Company Information</h2>
        </div>

        {company && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                company.active ? "bg-success/10 text-success" : "bg-surface-muted text-text-muted",
              )}
            >
              {company.active ? "Active" : "Inactive"}
            </span>
            {company.companyRole && (
              <span className="inline-flex items-center rounded-full border border-border-soft bg-surface/80 px-3 py-1 text-xs font-medium text-text-secondary">
                {company.companyRole}
              </span>
            )}
            {createdOn && (
              <span className="inline-flex items-center rounded-full border border-border-soft bg-surface/80 px-3 py-1 text-xs font-medium text-text-secondary">
                Company since {createdOn}
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div aria-busy="true" className="space-y-4 p-6">
          <span className="sr-only">Loading company information...</span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-border-soft pt-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex justify-end border-t border-border-soft pt-4">
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </div>
      )}

      {!isLoading && isUnavailable && (
        <p className="p-6 text-sm text-text-muted">No company information on file yet.</p>
      )}

      {!isLoading && loadError && (
        <div className="flex flex-wrap items-center gap-3 p-6">
          <p className="text-sm text-text-secondary">{loadError}</p>
          <Button type="button" variant="outline" size="sm" onClick={loadCompany}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && formData && (
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={nameId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Company Name
              </Label>
              <Input
                id={nameId}
                type="text"
                value={formData.name ?? ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={taxNumberId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Tax Number
              </Label>
              <Input
                id={taxNumberId}
                type="text"
                value={formData.taxNumber ?? ""}
                onChange={(e) => handleFieldChange("taxNumber", e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={emailId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Company Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id={emailId}
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className="pl-10"
                  placeholder="info@company.com"
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={phoneId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Company Phone
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id={phoneId}
                  type="tel"
                  value={formData.phoneNumber ?? ""}
                  onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                  className="pl-10"
                  placeholder="5xx xxx xxxx"
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={websiteId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Website
              </Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id={websiteId}
                  type="text"
                  value={formData.website ?? ""}
                  onChange={(e) => handleFieldChange("website", e.target.value)}
                  className="pl-10"
                  placeholder="www.company.com"
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={shipmentPolicyId}
                className="text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                Shipment Policy
              </Label>
              <select
                id={shipmentPolicyId}
                value={formData.shipmentPolicy}
                onChange={(e) => handleFieldChange("shipmentPolicy", e.target.value as ShipmentPolicy | "")}
                disabled={!canEdit}
                className="file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 h-11 w-full min-w-0 rounded-2xl border border-transparent bg-surface-elevated px-4 py-2 text-sm text-text-primary shadow-soft transition-[color,box-shadow,border-color,background-color] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-brand/40 focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">Not set</option>
                {(Object.keys(SHIPMENT_POLICY_DAYS) as ShipmentPolicy[]).map((policy) => (
                  <option key={policy} value={policy}>
                    {shipmentPolicyLabel(policy)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={descriptionId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Description
            </Label>
            <Textarea
              id={descriptionId}
              rows={3}
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={formData.description ?? ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Briefly describe your company and services"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={logoId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Company Logo URL
            </Label>
            <div className="flex items-center gap-3">
              {isHttpUrl(formData.companyPhoto) && !logoFailed && (
                <Image
                  src={formData.companyPhoto as string}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 shrink-0 rounded-xl border border-border-soft object-contain"
                  onError={() => setLogoFailed(true)}
                />
              )}
              <Input
                id={logoId}
                type="text"
                value={formData.companyPhoto ?? ""}
                onChange={(e) => handleFieldChange("companyPhoto", e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="border-t border-border-soft pt-4">
            <CheckboxField
              id={uberEnabledId}
              label="Enable Uber Direct delivery"
              description="Offer same-day courier delivery to buyers within 10 miles of your address."
              checked={formData.uberEnabled}
              onChange={(e) => handleFieldChange("uberEnabled", e.target.checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border-soft pt-4">
            {canEdit ? (
              <>
                <span />
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-text-muted">
                Only the company owner can edit these details. Contact your owner to request a change.
              </p>
            )}
          </div>
        </form>
      )}
    </SurfaceCard>
  )
}
