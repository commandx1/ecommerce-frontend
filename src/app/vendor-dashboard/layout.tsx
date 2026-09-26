"use client"

import DashboardShellFrame from "@/components/dashboard-shared/DashboardShellFrame"
import { DashboardMobileSidebarProvider } from "@/components/layout/DashboardMobileSidebarContext"
import NotificationSocketBridge from "@/features/notifications/components/NotificationSocketBridge"
import { CompanyRoleProvider } from "@/features/vendor-dashboard/shell/CompanyRoleContext"
import ImpersonationTabTitle from "@/features/vendor-dashboard/shell/ImpersonationTabTitle"
import VendorDashboardLayoutSkeleton from "@/features/vendor-dashboard/shell/VendorDashboardLayoutSkeleton"
import VendorHeader from "@/features/vendor-dashboard/shell/VendorHeader"
import VendorSidebar from "@/features/vendor-dashboard/shell/VendorSidebar"
import { useDashboardAuthGuard } from "@/lib/hooks/useDashboardAuthGuard"

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { status, unauthorizedRender } = useDashboardAuthGuard("vendor")

  if (status === "checking" || (status === "unauthorized" && unauthorizedRender === "skeleton")) {
    return <VendorDashboardLayoutSkeleton />
  }
  if (status === "unauthorized") {
    return null
  }

  return (
    <CompanyRoleProvider>
      <DashboardMobileSidebarProvider>
        <ImpersonationTabTitle />
        <NotificationSocketBridge />
        <DashboardShellFrame header={<VendorHeader />} sidebar={<VendorSidebar />}>
          {children}
        </DashboardShellFrame>
      </DashboardMobileSidebarProvider>
    </CompanyRoleProvider>
  )
}
