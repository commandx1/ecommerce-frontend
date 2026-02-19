"use client"

import AccountSettingsShared from "@/components/dashboard-shared/AccountSettingsShared"

export default function SettingsPage() {
  return (
    <AccountSettingsShared
      title="Account Settings"
      description="Manage your professional profile and security preferences."
      infoSidebarTitle="Security Tip"
      infoSidebarContent="Enable Two-Factor Authentication (2FA) to protect your account from unauthorized access. We recommend using an authenticator app."
    />
  )
}
