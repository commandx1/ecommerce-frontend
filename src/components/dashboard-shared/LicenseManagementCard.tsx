"use client"

import { AlertCircle, BadgeCheck, Clock3, FileBadge2, Plus, ShieldX, Trash2 } from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Modal from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/components/ui/Toast"
import usStateList from "@/data/usstate-list.json"
import { type CreateLicensePayload, type License, licenseAPI, type LicenseType } from "@/lib/api/licenses"
import { cn } from "@/lib/utils"

const US_STATES = usStateList.slice(
  0,
  usStateList.findIndex((state) => state.name === "Alberta"),
)

const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  DEA: "DEA",
  STATE_DENTAL: "State Dental",
}

function formatExpiration(license: License) {
  const date = new Date(license.year, license.month - 1, license.day)
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
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

const emptyFormData: CreateLicensePayload = {
  licenseType: "STATE_DENTAL",
  stateOfLicense: "",
  licenseNumber: "",
  year: 0,
  month: 0,
  day: 0,
}

export default function LicenseManagementCard() {
  const idBase = useId()
  const licenseTypeId = `${idBase}-license-type`
  const stateOfLicenseId = `${idBase}-state`
  const licenseNumberId = `${idBase}-license-number`
  const expirationId = `${idBase}-expiration`

  const [licenses, setLicenses] = useState<License[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<CreateLicensePayload>(emptyFormData)
  const [expirationDate, setExpirationDate] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchLicenses = useCallback(async () => {
    try {
      const data = await licenseAPI.getLicenses()
      setLicenses(data)
    } catch (_error) {
      showToast.error("An error occurred while loading licenses")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const handleAddNew = () => {
    setFormData(emptyFormData)
    setExpirationDate("")
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.licenseNumber.trim()) {
      showToast.error("License number is required")
      return
    }
    if (formData.licenseType === "STATE_DENTAL" && !formData.stateOfLicense?.trim()) {
      showToast.error("State of license is required")
      return
    }
    if (!expirationDate) {
      showToast.error("Expiration date is required")
      return
    }

    const [year, month, day] = expirationDate.split("-").map(Number)

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
      setIsFormOpen(false)
      fetchLicenses()
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
      fetchLicenses()
    } catch (_error) {
      showToast.error("An error occurred while deleting the license")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="flex-1 overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="flex items-center justify-between border-b border-border-soft p-6">
        <div className="flex items-center space-x-3">
          <FileBadge2 className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold text-text-primary">License Information</h2>
        </div>
        <Button type="button" onClick={handleAddNew} variant="quiet" size="icon-sm" aria-label="Add license">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : licenses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong p-8 text-center">
            <FileBadge2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">You haven't added a license yet.</p>
            <Button type="button" onClick={handleAddNew} variant="link" size="sm" className="mt-2 h-auto p-0">
              Add your first license
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {licenses.map((license) => (
              <li
                key={license.id}
                className={cn(
                  "rounded-xl border p-4",
                  license.approved === false ? "border-danger/30" : "border-border-soft",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {LICENSE_TYPE_LABELS[license.licenseType]}
                      {license.stateOfLicense ? ` · ${license.stateOfLicense}` : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">#{license.licenseNumber}</p>
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
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add License" maxWidthClassName="max-w-md">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <FileBadge2 className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold text-text-primary">Add License</h3>
          </div>

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
              <SelectTrigger id={licenseTypeId} className="w-full">
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
                onValueChange={(value: string) => setFormData({ ...formData, stateOfLicense: value })}
              >
                <SelectTrigger id={stateOfLicenseId} className="w-full">
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
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={licenseNumberId} className="text-text-secondary">
              License Number
            </Label>
            <Input
              id={licenseNumberId}
              type="text"
              required
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="D123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={expirationId} className="text-text-secondary">
              Expiration Date
            </Label>
            <Input
              id={expirationId}
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={isSaving} className="rounded-lg">
              {isSaving ? "Saving..." : "Save License"}
            </Button>
            <Button type="button" onClick={() => setIsFormOpen(false)} variant="outline" className="rounded-lg">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

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
    </section>
  )
}
