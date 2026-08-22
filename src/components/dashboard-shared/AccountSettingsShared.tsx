"use client"

import { BadgeCheck, Fingerprint, Lock, Mail, MapPinned, Phone, Save, Shield, Sparkles, User } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useId, useState } from "react"
import LicenseManagementCard from "@/components/dashboard-shared/LicenseManagementCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showToast } from "@/components/ui/Toast"
import { updateMe } from "@/lib/api/account"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"

interface AccountSettingsSharedProps {
  title: string
  description: string
  /** Label used for the quick-nav pill that jumps to `children`. */
  extraSectionLabel?: string
  /** Extra section(s) rendered below Security, e.g. an embedded address manager. */
  children?: ReactNode
}

export default function AccountSettingsShared({
  title,
  description,
  extraSectionLabel = "Addresses",
  children,
}: AccountSettingsSharedProps) {
  const { user, setUser, accessToken } = useAuthStore()
  const isVendor = user?.roleName === "Vendor"
  const idBase = useId()
  const firstNameId = `${idBase}-first-name`
  const lastNameId = `${idBase}-last-name`
  const emailId = `${idBase}-email`
  const phoneId = `${idBase}-phone`
  const twoFactorId = `${idBase}-two-factor`
  const profileSectionId = `${idBase}-profile-section`
  const securitySectionId = `${idBase}-security-section`
  const extraSectionId = `${idBase}-extra-section`

  const [formData, setFormData] = useState({
    name: user?.name || "",
    surname: user?.surname || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    twoFactorEnabled: user?.twoFactorEnabled || false,
  })

  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdating2FA, setIsUpdating2FA] = useState(false)
  const memberSince = user?.createdDate
    ? new Date(user.createdDate).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "-"

  const initials =
    `${user?.name?.[0] || ""}${user?.surname?.[0] || ""}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"

  // Sync with store if user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        surname: user.surname,
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        twoFactorEnabled: user.twoFactorEnabled || false,
      })
    }
  }, [user])

  const updateProfile = async (newData: typeof formData) => {
    if (!accessToken) {
      throw new Error("Authentication required. Please log in again.")
    }
    const updatedUser = await updateMe(accessToken, newData)
    setUser(updatedUser)
    return updatedUser
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      await updateProfile(formData)
      showToast.success("Profile updated successfully!")
    } catch (_error) {
      showToast.error("Failed to update profile. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    setIsUpdating2FA(true)
    const newData = { ...formData, twoFactorEnabled: enabled }

    try {
      await updateProfile(newData)
      setFormData(newData)
      showToast.success(`Two-factor authentication ${enabled ? "enabled" : "disabled"}`)
    } catch (_error) {
      showToast.error("Failed to update security settings.")
    } finally {
      setIsUpdating2FA(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Hero */}
      <div className="spotlight-border fade-up relative overflow-hidden rounded-3xl border border-border-soft bg-surface-elevated p-6 shadow-panel sm:p-8">
        <div className="mesh-panel pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-strong font-display text-2xl text-inverse-foreground shadow-panel">
              {initials}
            </div>
            <div>
              <span className="section-kicker">
                <Sparkles className="mr-1.5 h-3 w-3" />
                {isVendor ? "Vendor Account" : "Buyer Account"}
              </span>
              <h1 className="mt-3 font-display text-3xl leading-tight text-text-primary sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-md text-text-secondary">{description}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/80 px-3 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm">
              Member since {memberSince}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                formData.twoFactorEnabled ? "bg-success/10 text-success" : "bg-surface/80 text-text-muted",
              )}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              2FA {formData.twoFactorEnabled ? "Enabled" : "Off"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <nav
        className="fade-up flex flex-wrap gap-2"
        style={{ animationDelay: "80ms" }}
        aria-label="Jump to settings section"
      >
        <a
          href={`#${profileSectionId}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-elevated px-4 py-1.5 text-xs font-semibold text-text-secondary shadow-soft transition-colors hover:border-brand/40 hover:text-brand"
        >
          <User className="h-3.5 w-3.5" />
          Profile
        </a>
        <a
          href={`#${securitySectionId}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-elevated px-4 py-1.5 text-xs font-semibold text-text-secondary shadow-soft transition-colors hover:border-brand/40 hover:text-brand"
        >
          <Shield className="h-3.5 w-3.5" />
          Security
        </a>
        {children && (
          <a
            href={`#${extraSectionId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-elevated px-4 py-1.5 text-xs font-semibold text-text-secondary shadow-soft transition-colors hover:border-brand/40 hover:text-brand"
          >
            <MapPinned className="h-3.5 w-3.5" />
            {extraSectionLabel}
          </a>
        )}
      </nav>

      <div className="space-y-6">
        <div
          id={profileSectionId}
          className={cn("grid scroll-mt-24 grid-cols-1 gap-6", !isVendor && "lg:grid-cols-2 lg:items-start")}
        >
          <section
            className="fade-up overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-3 border-b border-border-soft p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <User className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold text-text-primary">Personal Information</h2>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor={firstNameId}
                    className="text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    First Name
                  </Label>
                  <Input
                    id={firstNameId}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={lastNameId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Last Name
                  </Label>
                  <Input
                    id={lastNameId}
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={emailId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id={emailId}
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={phoneId} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id={phoneId}
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="pl-10"
                    placeholder="5xx xxx xxxx"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-border-soft pt-4">
                <Button type="submit" disabled={isUpdating}>
                  <Save className="h-4 w-4" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </section>

          {!isVendor && (
            <div className="fade-up" style={{ animationDelay: "160ms" }}>
              <LicenseManagementCard />
            </div>
          )}
        </div>

        {/* Security Section */}
        <div id={securitySectionId} className="scroll-mt-24">
          <section
            className="fade-up overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center gap-3 border-b border-border-soft p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Shield className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold text-text-primary">Security</h2>
            </div>
            <div className="divide-y divide-border-soft">
              <div className="flex items-center justify-between gap-4 p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand">
                    <Fingerprint className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-medium text-text-primary">Two-Factor Authentication</h3>
                    <p className="text-sm text-text-muted">Add an extra layer of security to your account.</p>
                  </div>
                </div>

                <label
                  htmlFor={twoFactorId}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
                    formData.twoFactorEnabled ? "border-brand bg-brand" : "border-border-strong bg-surface-muted",
                    isUpdating2FA && "opacity-50",
                  )}
                >
                  <input
                    id={twoFactorId}
                    type="checkbox"
                    className="peer sr-only"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => handle2FAToggle(e.target.checked)}
                    disabled={isUpdating2FA}
                  />
                  <span
                    className={cn(
                      "inline-block h-4 w-4 translate-x-1 rounded-full bg-surface-elevated shadow-soft transition-transform",
                      formData.twoFactorEnabled && "translate-x-6",
                    )}
                  />
                  <span className="sr-only">Toggle two-factor authentication</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand">
                    <Lock className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-medium text-text-primary">Password</h3>
                    <p className="text-sm text-text-muted">Manage your account password.</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </section>
        </div>

        {children && (
          <div id={extraSectionId} className="scroll-mt-24">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
