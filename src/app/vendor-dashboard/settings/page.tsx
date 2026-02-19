"use client"

import AccountSettingsShared from "@/components/dashboard-shared/AccountSettingsShared"

export default function VendorSettingsPage() {
  return (
    <AccountSettingsShared
      title="Vendor Settings"
      description="Manage your vendor profile and security preferences."
      infoSidebarTitle="Vendor Support"
      infoSidebarContent="For any account-related inquiries or technical support, please contact your dedicated account manager or use our help center."
    />
  )
}
