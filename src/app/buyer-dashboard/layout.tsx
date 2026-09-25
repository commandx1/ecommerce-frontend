"use client"

// No loading.tsx under the buyer/vendor dashboards: a background tab's <Link> prefetch is judged by
// the FOCUSED tab's auth cookie (per-tab sessions), so proxy.ts can cache a cross-role redirect in
// this tab's router. A loading boundary makes the router commit that stale redirect instantly
// (see multi-account-tabs.spec.ts "a real cross-tab logout ..."). Fix the prefetch first.

import { useId } from "react"
import { DashboardMobileSidebarProvider } from "@/components/layout/DashboardMobileSidebarContext"
import BuyerDashboardLayoutSkeleton from "@/features/buyer-dashboard/shell/BuyerDashboardLayoutSkeleton"
import BuyerHeader from "@/features/buyer-dashboard/shell/BuyerHeader"
import BuyerSidebar from "@/features/buyer-dashboard/shell/BuyerSidebar"
import NotificationSocketBridge from "@/features/notifications/components/NotificationSocketBridge"
import { useDashboardAuthGuard } from "@/lib/hooks/useDashboardAuthGuard"

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const mainContentId = useId()
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
      <div data-theme-scope="dashboard" className="relative isolate flex min-h-screen flex-col">
        <div className="dashboard-backdrop" aria-hidden />
        <BuyerHeader />
        <div className="flex flex-1">
          <BuyerSidebar />
          <main id={mainContentId} className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardMobileSidebarProvider>
  )
}
