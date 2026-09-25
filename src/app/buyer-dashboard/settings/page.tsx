"use client"

import AccountSettingsShared from "@/features/account-settings/AccountSettingsShared"
import AddressManagementShared from "@/features/account-settings/components/AddressManagementShared"

export default function SettingsPage() {
  return (
    <AccountSettingsShared
      title="Account Settings"
      description="Manage your professional profile and security preferences."
      extraSectionLabel="Address"
    >
      <AddressManagementShared />
    </AccountSettingsShared>
  )
}
