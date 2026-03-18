"use client"

import { AlertTriangle, Fingerprint, Lock, Phone, Save, Shield, Trash2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
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
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile. Please try again.")
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
      toast.success(`Two-factor authentication ${enabled ? "enabled" : "disabled"}`)
    } catch (error) {
      toast.error("Failed to update security settings.")
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

      toast.success("Account deleted successfully.")
      clearAuth()
      router.push("/")
    } catch (error) {
      toast.error((error as Error).message || "Failed to delete account. Please contact support.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-steel-blue">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
              <User className="w-5 h-5 text-steel-blue" />
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="surname" className="text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="surname"
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue"
                    placeholder="5xx xxx xxxx"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center px-6 py-2 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>

          {/* Security Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
              <Shield className="w-5 h-5 text-steel-blue" />
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 bg-light-mint-gray p-2 rounded-lg">
                    <Fingerprint className="w-5 h-5 text-steel-blue" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => handle2FAToggle(e.target.checked)}
                    disabled={isUpdating2FA}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-steel-blue ${isUpdating2FA ? "opacity-50" : ""}`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 bg-light-mint-gray p-2 rounded-lg">
                    <Lock className="w-5 h-5 text-steel-blue" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Password</h3>
                    <p className="text-sm text-gray-500">Manage your account password.</p>
                  </div>
                </div>
                <button type="button" className="text-sm font-semibold text-steel-blue hover:underline">
                  Change Password
                </button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden">
            <div className="p-6 border-b border-red-100 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-red-700 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-red-200 space-y-4">
                  <p className="text-sm font-medium text-gray-900">
                    Are you absolutely sure you want to delete your account?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Email Verified</span>
                {user?.emailConfirmed ? (
                  <span className="text-green-600 font-medium">Verified</span>
                ) : (
                  <span className="text-yellow-600 font-medium">Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="text-gray-900 font-medium">
                  {user?.createdDate ? new Date(user.createdDate).toLocaleDateString() : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Account Type</span>
                <span className="text-gray-900 font-medium font-mono">{user?.roleName || "User"}</span>
              </div>
            </div>
          </div>

          <div className="bg-light-mint-gray rounded-2xl p-6">
            <h3 className="font-semibold text-steel-blue mb-2">{infoSidebarTitle}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{infoSidebarContent}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
