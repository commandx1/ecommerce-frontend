"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"

function SetupVendorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const performSetup = async () => {
      const refreshToken = searchParams.get("refreshToken")

      if (!refreshToken) {
        toast.error("No setup token provided")
        router.push("/login")
        return
      }

      try {
        // Exchange setup/refresh token for access token using our internal API proxy
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

          // Update store (not impersonating, just a setup/login)
          setAuth(userObj, data.accessToken, data.refreshToken || refreshToken, false)
          
          toast.success("Account setup successful!", {
            description: "Please complete your profile information.",
            duration: 5000,
          })

          // Redirect to settings page as requested
          setTimeout(() => {
            router.push("/vendor-dashboard/settings")
          }, 800)
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || "Setup failed")
        }
      } catch (error) {
        console.error("Setup error:", error)
        toast.error("An error occurred during setup")
      }
    }

    performSetup()
  }, [searchParams, router, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-mint-gray">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-steel-blue mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-steel-blue">Setting up your account...</h2>
        <p className="text-gray-600">Please wait while we prepare your vendor dashboard.</p>
      </div>
    </div>
  )
}

export default function SetupVendorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupVendorContent />
    </Suspense>
  )
}
