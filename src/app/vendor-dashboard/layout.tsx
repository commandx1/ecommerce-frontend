"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { cookieStorage } from "@/lib/storage/cookie-storage"
import { useAuthStore } from "@/stores/authStore"
import VendorHeader from "./components/VendorHeader"
import VendorSidebar from "./components/VendorSidebar"

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
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

  // Show loading while checking or if not authenticated/vendor
  if (isChecking || !isAuthenticated || !user || user.roleName !== "Vendor") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-light-mint-gray">
      <VendorHeader />
      <div className="flex flex-1">
        <VendorSidebar />
        <main id="main-content" className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
