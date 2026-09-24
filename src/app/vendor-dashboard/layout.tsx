"use client"

// No loading.tsx under the buyer/vendor dashboards: a background tab's <Link> prefetch is judged by
// the FOCUSED tab's auth cookie (per-tab sessions), so proxy.ts can cache a cross-role redirect in
// this tab's router. A loading boundary makes the router commit that stale redirect instantly
// (see multi-account-tabs.spec.ts "a real cross-tab logout ..."). Fix the prefetch first.

import { useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { DashboardMobileSidebarProvider } from "@/components/layout/DashboardMobileSidebarContext"
import NotificationSocketBridge from "@/features/notifications/components/NotificationSocketBridge"
import { tabSessionStorage } from "@/lib/storage/tab-session-storage"
import { useAuthStore } from "@/stores/authStore"
import { CompanyRoleProvider } from "./CompanyRoleContext"
import ImpersonationTabTitle from "./components/ImpersonationTabTitle"
import VendorDashboardLayoutSkeleton from "./components/VendorDashboardLayoutSkeleton"
import VendorHeader from "./components/VendorHeader"
import VendorSidebar from "./components/VendorSidebar"

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const mainContentId = useId()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check cookie directly first (before hydration completes)
    const checkAuth = () => {
      try {
        const cookieData = tabSessionStorage.getItem("auth-storage")
        if (cookieData) {
          let parsed = null
          try {
            parsed = JSON.parse(cookieData)
          } catch {
            const decoded = decodeURIComponent(cookieData)
            parsed = JSON.parse(decoded)
          }
          const storedUser = parsed?.state?.user
          const storedIsAuthenticated = parsed?.state?.isAuthenticated

          // If cookie has user but store doesn't yet, wait a bit for hydration
          if (storedUser && storedIsAuthenticated) {
            // Check if user is a vendor
            if (storedUser.roleName !== "Vendor") {
              router.push("/buyer-dashboard")
              return
            }
            // If vendor, wait for store to hydrate
            setTimeout(() => {
              const currentUser = useAuthStore.getState().user
              if (!currentUser || currentUser.roleName !== "Vendor") {
                router.push("/buyer-dashboard")
              } else {
                setIsChecking(false)
              }
            }, 100)
            return
          }
        }

        // No cookie or no user in cookie
        if (!isAuthenticated || !user) {
          router.push("/login")
          return
        }

        // Check if user is a vendor
        if (user.roleName !== "Vendor") {
          router.push("/buyer-dashboard")
          return
        }

        setIsChecking(false)
      } catch {
        // Error reading cookie, check store
        if (!isAuthenticated || !user) {
          router.push("/login")
        } else if (user.roleName !== "Vendor") {
          router.push("/buyer-dashboard")
        } else {
          setIsChecking(false)
        }
      }
    }

    checkAuth()
  }, [user, isAuthenticated, router])

  // Show full-page skeleton while auth state is being resolved.
  if (isChecking) {
    return <VendorDashboardLayoutSkeleton />
  }

  if (!isAuthenticated || !user || user.roleName !== "Vendor") {
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
