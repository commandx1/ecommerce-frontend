"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { showToast } from "@/components/ui/Toast"
import { refreshTokenForVendorSetup } from "@/lib/api/setup-vendor"
import { useAuthStore } from "@/stores/authStore"

function SetupVendorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const performSetup = async () => {
      const refreshToken = searchParams.get("refreshToken")

      if (!refreshToken) {
        showToast.error("No setup token provided")
        router.push("/login")
        return
      }

      try {
        const data = await refreshTokenForVendorSetup(refreshToken)

        // Role correction: force Vendor if null
        const userObj = {
          ...data,
          roleName: data.roleName || "Vendor",
        }

        // Update store (not impersonating, just a setup/login)
        setAuth(userObj as any, data.accessToken, (data.refreshToken as string | undefined) || refreshToken, false)

        showToast.success("Account setup successful!", "Please complete your profile information.", 5000)

        // Redirect to settings page as requested
        setTimeout(() => {
          router.push("/vendor-dashboard/settings")
        }, 800)
      } catch (error) {
        console.error("Setup error:", error)
        showToast.error(error instanceof Error ? error.message : "An error occurred during setup")
        router.push("/login")
      }
    }

    performSetup()
  }, [searchParams, router, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
