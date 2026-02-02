"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"

function ImpersonateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const performImpersonation = async () => {
      const refreshToken = searchParams.get("refreshToken")

      if (!refreshToken) {
        toast.error("No refresh token provided")
        router.push("/login")
        return
      }

      try {
        // Exchange refresh token for access token using our internal API proxy
        const response = await fetch("/api/auth/refresh-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (response.ok) {
          const data = await response.json()
          
          // Role correction: force Vendor if null
          const userObj = {
            ...data,
            roleName: data.roleName || "Vendor"
          }

          // Update store
          setAuth(userObj, data.accessToken, data.refreshToken || refreshToken, true)
          
          toast.success("Logged in as Vendor (Admin Impersonation)", {
            description: "You are currently viewing this account as an administrator.",
            duration: 5000,
          })

          // Redirect to dashboard
          router.push("/vendor-dashboard")
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || "Impersonation failed")
          router.push("/login")
        }
      } catch (error) {
        console.error("Impersonation error:", error)
        toast.error("An error occurred during impersonation")
        router.push("/login")
      }
    }

    performImpersonation()
  }, [searchParams, router, setAuth])

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-light-mint-gray">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-steel-blue mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-steel-blue">Switching accounts...</h2>
        <p className="text-gray-600">Please wait while we set up your session.</p>
      </div>
    </div>
  )
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImpersonateContent />
    </Suspense>
  )
}
