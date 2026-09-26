"use client"

import DashboardShellFrame from "@/components/dashboard-shared/DashboardShellFrame"
import { DashboardMobileSidebarProvider } from "@/components/layout/DashboardMobileSidebarContext"
import BuyerDashboardLayoutSkeleton from "@/features/buyer-dashboard/shell/BuyerDashboardLayoutSkeleton"
import BuyerHeader from "@/features/buyer-dashboard/shell/BuyerHeader"
import BuyerSidebar from "@/features/buyer-dashboard/shell/BuyerSidebar"
import NotificationSocketBridge from "@/features/notifications/components/NotificationSocketBridge"
import { useDashboardAuthGuard } from "@/lib/hooks/useDashboardAuthGuard"

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { status, unauthorizedRender } = useDashboardAuthGuard("buyer")

  if (status === "checking" || (status === "unauthorized" && unauthorizedRender === "skeleton")) {
    return <BuyerDashboardLayoutSkeleton />
  }
  if (status === "unauthorized") {
    return null
  }

  return (
    <DashboardMobileSidebarProvider>
      <NotificationSocketBridge />
      <DashboardShellFrame header={<BuyerHeader />} sidebar={<BuyerSidebar />} mainClassName="overflow-auto">
        {children}
      </DashboardShellFrame>
    </DashboardMobileSidebarProvider>
  )
}
