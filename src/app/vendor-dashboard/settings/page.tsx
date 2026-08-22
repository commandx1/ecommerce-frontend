"use client"

import AccountSettingsShared from "@/components/dashboard-shared/AccountSettingsShared"
import AddressManagementShared from "@/components/dashboard-shared/AddressManagementShared"

export default function VendorSettingsPage() {
  return (
    <AccountSettingsShared title="Vendor Settings" description="Manage your vendor profile and security preferences.">
      <AddressManagementShared embedded />
    </AccountSettingsShared>
  )
}
