"use client"

// No loading.tsx under the buyer/vendor dashboards: a background tab's <Link> prefetch is judged by
// the FOCUSED tab's auth cookie (per-tab sessions), so proxy.ts can cache a cross-role redirect in
// this tab's router. A loading boundary makes the router commit that stale redirect instantly
// (see multi-account-tabs.spec.ts "a real cross-tab logout ..."). Fix the prefetch first.

import { useId } from "react"
import { DashboardMobileSidebarProvider } from "@/components/layout/DashboardMobileSidebarContext"
import NotificationSocketBridge from "@/features/notifications/components/NotificationSocketBridge"
import { CompanyRoleProvider } from "@/features/vendor-dashboard/shell/CompanyRoleContext"
import ImpersonationTabTitle from "@/features/vendor-dashboard/shell/ImpersonationTabTitle"
import VendorDashboardLayoutSkeleton from "@/features/vendor-dashboard/shell/VendorDashboardLayoutSkeleton"
import VendorHeader from "@/features/vendor-dashboard/shell/VendorHeader"
import VendorSidebar from "@/features/vendor-dashboard/shell/VendorSidebar"
import { useDashboardAuthGuard } from "@/lib/hooks/useDashboardAuthGuard"

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const mainContentId = useId()
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
        <div data-theme-scope="dashboard" className="relative isolate flex min-h-screen flex-col">
          <div className="dashboard-backdrop" aria-hidden />
          <VendorHeader />
          <div className="flex flex-1">
            <VendorSidebar />
            <main id={mainContentId} className="min-w-0 flex-1 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </DashboardMobileSidebarProvider>
    </CompanyRoleProvider>
  )
}
