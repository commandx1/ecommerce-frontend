"use client"

import DashboardHeader from "@/components/layout/DashboardHeader"
import NotificationBell from "@/features/notifications/components/NotificationBell"

// No top nav: the sidebar is the single navigation source.
export default function BuyerHeader() {
  return <DashboardHeader accountFallbackName="Account" showCart showSearch notificationBell={<NotificationBell />} />
}
