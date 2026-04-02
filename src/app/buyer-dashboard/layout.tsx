"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cookieStorage } from "@/lib/storage/cookie-storage"
import { useAuthStore } from "@/stores/authStore"
import BuyerHeader from "./components/BuyerHeader"
import DashboardSidebar from "./components/DashboardSidebar"

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check cookie directly first (before hydration completes)
    const checkAuth = () => {
      try {
        const cookieData = cookieStorage.getItem("auth-storage")
        if (cookieData) {
          const parsed = JSON.parse(cookieData)
          const storedUser = parsed?.state?.user
          const storedIsAuthenticated = parsed?.state?.isAuthenticated

          // If cookie has user but store doesn't yet, wait a bit for hydration
          if (storedUser && storedIsAuthenticated) {
            // Check if user is a vendor
            if (storedUser.roleName === "Vendor") {
              router.push("/vendor-dashboard")
              return
            }
            // If buyer, wait for store to hydrate
            setTimeout(() => {
              const currentUser = useAuthStore.getState().user
              if (!currentUser) {
                router.push("/login")
              } else if (currentUser.roleName === "Vendor") {
                router.push("/vendor-dashboard")
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
        if (user.roleName === "Vendor") {
          router.push("/vendor-dashboard")
          return
        }

        setIsChecking(false)
      } catch {
        // Error reading cookie, check store
        if (!isAuthenticated || !user) {
          router.push("/login")
        } else if (user.roleName === "Vendor") {
          router.push("/vendor-dashboard")
        } else {
          setIsChecking(false)
        }
      }
    }

    checkAuth()
  }, [user, isAuthenticated, router])

  // Show loading while checking or if not authenticated/vendor
  if (isChecking || !isAuthenticated || !user || user.roleName === "Vendor") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-gray-50">
      <BuyerHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main id="main-content" className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
