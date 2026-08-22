"use client"

import { Building2, Globe, Mail, Phone, Save } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showToast } from "@/components/ui/Toast"
import { Textarea } from "@/components/ui/textarea"
import { type CompanyProfile, getMyCompany, type UpdateCompanyPayload, updateMyCompany } from "@/lib/api/company"
import { ApiRequestError } from "@/lib/api/request"
import { cn } from "@/lib/utils"

/** Statuses that mean "no company data to show" rather than a real failure. */
const EMPTY_STATE_STATUSES = new Set([404, 501])

const DESCRIPTION_MAX_LENGTH = 2000

/** The logo is a free-text URL, so only render absolute http(s) values through next/image. */
const isRenderableImageUrl = (value: string | null) => {
  if (!value) return false

  try {
    const { protocol } = new URL(value)
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

const toFormState = (company: CompanyProfile): UpdateCompanyPayload => ({
  name: company.name || "",
  companyPhoto: company.companyPhoto || "",
  taxNumber: company.taxNumber || "",
  email: company.email || "",
  phoneNumber: company.phoneNumber || "",
  website: company.website || "",
  description: company.description || "",
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

  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [formData, setFormData] = useState<UpdateCompanyPayload | null>(null)
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

  const handleFieldChange = (field: keyof UpdateCompanyPayload, value: string) => {
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
      const updated = await updateMyCompany(formData)
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
    <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
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

      {isLoading && <p className="p-6 text-sm text-text-muted">Loading company information...</p>}

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
              {isRenderableImageUrl(formData.companyPhoto) && !logoFailed && (
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
    </section>
  )
}
