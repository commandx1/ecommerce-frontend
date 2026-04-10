"use client"

import { AlertTriangle, Fingerprint, Lock, Phone, Save, Shield, Trash2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showToast } from "@/components/ui/Toast"
import { deleteMe, updateMe } from "@/lib/api/account"
import { useAuthStore } from "@/stores/authStore"

interface AccountSettingsSharedProps {
  title: string
  description: string
  infoSidebarTitle: string
  infoSidebarContent: string
}

export default function AccountSettingsShared({
  title,
  description,
  infoSidebarTitle,
  infoSidebarContent,
}: AccountSettingsSharedProps) {
  const { user, setUser, clearAuth, accessToken } = useAuthStore()
  const router = useRouter()
  const idBase = useId()
  const firstNameId = `${idBase}-first-name`
  const lastNameId = `${idBase}-last-name`
  const phoneId = `${idBase}-phone`
  const twoFactorId = `${idBase}-two-factor`

  const [formData, setFormData] = useState({
    name: user?.name || "",
    surname: user?.surname || "",
    phoneNumber: user?.phoneNumber || "",
    twoFactorEnabled: user?.twoFactorEnabled || false,
  })

  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdating2FA, setIsUpdating2FA] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Sync with store if user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        surname: user.surname,
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
    } catch (error) {
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
    } catch (error) {
      showToast.error("Failed to update security settings.")
    } finally {
      setIsUpdating2FA(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      if (!accessToken) {
        throw new Error("Authentication required. Please log in again.")
      }
      await deleteMe(accessToken)

      showToast.success("Account deleted successfully.")
      clearAuth()
      router.push("/")
    } catch (error) {
      showToast.error((error as Error).message || "Failed to delete account. Please contact support.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
        <p className="mt-2 text-text-secondary">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
            <div className="flex items-center space-x-3 border-b border-border-soft p-6">
              <User className="h-5 w-5 text-brand" />
              <h2 className="text-xl font-semibold text-text-primary">Personal Information</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={firstNameId} className="text-sm font-medium text-text-secondary">
                    First Name
                  </Label>
                  <Input
                    id={firstNameId}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-lg border border-border-soft bg-surface"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={lastNameId} className="text-sm font-medium text-text-secondary">
                    Last Name
                  </Label>
                  <Input
                    id={lastNameId}
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="rounded-lg border border-border-soft bg-surface"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={phoneId} className="text-sm font-medium text-text-secondary">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-text-muted" />
                  <Input
                    id={phoneId}
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="rounded-lg border border-border-soft bg-surface py-2 pl-10 pr-4"
                    placeholder="5xx xxx xxxx"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isUpdating} className="rounded-lg">
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </section>

          {/* Security Section */}
          <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
            <div className="flex items-center space-x-3 border-b border-border-soft p-6">
              <Shield className="h-5 w-5 text-brand" />
              <h2 className="text-xl font-semibold text-text-primary">Security</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 rounded-lg bg-surface-muted p-2">
                    <Fingerprint className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Two-Factor Authentication</h3>
                    <p className="text-sm text-text-muted">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={twoFactorId}
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => handle2FAToggle(e.target.checked)}
                    disabled={isUpdating2FA}
                  />
                  <Label htmlFor={twoFactorId} className="text-sm text-text-secondary">
                    {formData.twoFactorEnabled ? "Enabled" : "Enable"}
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-soft pt-6">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 rounded-lg bg-surface-muted p-2">
                    <Lock className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Password</h3>
                    <p className="text-sm text-text-muted">Manage your account password.</p>
                  </div>
                </div>
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm font-semibold">
                  Change Password
                </Button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="overflow-hidden rounded-2xl border border-danger/20 bg-danger/10">
            <div className="flex items-center space-x-3 border-b border-danger/20 p-6">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <h2 className="text-xl font-semibold text-danger">Danger Zone</h2>
            </div>
            <div className="p-6">
              <p className="mb-4 text-sm text-danger">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="unstyled"
                  className="flex items-center rounded-lg bg-danger px-4 py-2 text-primary-foreground transition-colors hover:opacity-90"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 rounded-xl border border-danger/20 bg-surface-elevated p-4">
                  <p className="text-sm font-medium text-text-primary">
                    Are you absolutely sure you want to delete your account?
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      variant="unstyled"
                      className="rounded-lg bg-danger px-4 py-2 text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="unstyled"
                      className="rounded-lg bg-surface-muted px-4 py-2 text-text-secondary transition-colors hover:bg-surface"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft">
            <h3 className="mb-4 font-semibold text-text-primary">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Email Verified</span>
                {user?.emailConfirmed ? (
                  <span className="font-medium text-success">Verified</span>
                ) : (
                  <span className="font-medium text-warning">Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Member Since</span>
                <span className="font-medium text-text-primary">
                  {user?.createdDate ? new Date(user.createdDate).toLocaleDateString() : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Account Type</span>
                <span className="font-mono font-medium text-text-primary">{user?.roleName || "User"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-muted/70 p-6">
            <h3 className="mb-2 font-semibold text-brand">{infoSidebarTitle}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{infoSidebarContent}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
