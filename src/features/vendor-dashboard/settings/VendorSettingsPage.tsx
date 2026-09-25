"use client"

import AccountSettingsShared from "@/features/account-settings/AccountSettingsShared"
import AddressManagementShared from "@/features/account-settings/components/AddressManagementShared"

export default function VendorSettingsPage() {
  return (
    <AccountSettingsShared title="Vendor Settings" description="Manage your vendor profile and security preferences.">
      <AddressManagementShared />
    </AccountSettingsShared>
  )
}
