"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { cookieStorage } from "@/lib/storage/cookie-storage"
import { useAuthStore } from "@/stores/authStore"
import VendorDashboardLayoutSkeleton from "./components/VendorDashboardLayoutSkeleton"
import VendorHeader from "./components/VendorHeader"
import VendorSidebar from "./components/VendorSidebar"

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const mainContentId = useId()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  // Handle impersonation toast
  useEffect(() => {
    if (searchParams.get("impersonated") === "true") {
      // Small delay to ensure Toaster is mounted and ready
      const timer = setTimeout(() => {
        showToast.success(
          "Logged in as Vendor (Admin Impersonation)",
          "You are currently viewing this account as an administrator.",
          5000,
        )
      }, 1000)

      // Clean up the URL without triggering a re-render/redirect
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)

      return () => clearTimeout(timer)
    }
  }, [searchParams])

  useEffect(() => {
    // Check cookie directly first (before hydration completes)
    const checkAuth = () => {
      try {
        const cookieData = cookieStorage.getItem("auth-storage")
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
    <div className="flex min-h-screen flex-col bg-canvas">
      <VendorHeader />
      <div className="flex flex-1">
        <VendorSidebar />
        <main id={mainContentId} className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
