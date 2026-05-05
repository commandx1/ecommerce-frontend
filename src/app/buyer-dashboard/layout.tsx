"use client"

import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { cookieStorage } from "@/lib/storage/cookie-storage"
import { useAuthStore } from "@/stores/authStore"
import BuyerDashboardLayoutSkeleton from "./components/BuyerDashboardLayoutSkeleton"
import BuyerHeader from "./components/BuyerHeader"
import DashboardSidebar from "./components/DashboardSidebar"

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const mainContentId = useId()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const wasAuthenticatedRef = useRef(false)

  // Track if they were authenticated in this session context
  if (isAuthenticated && user) {
    wasAuthenticatedRef.current = true
  }

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
                router.push(wasAuthenticatedRef.current ? "/" : "/login")
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
          router.push(wasAuthenticatedRef.current ? "/" : "/login")
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
          router.push(wasAuthenticatedRef.current ? "/" : "/login")
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
    return <BuyerDashboardLayoutSkeleton />
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <BuyerHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main id={mainContentId} className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
