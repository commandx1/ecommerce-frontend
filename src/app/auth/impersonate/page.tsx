"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { toast } from "sonner"
import { refreshTokenForImpersonation } from "@/lib/api/impersonation"
import { useAuthStore } from "@/stores/authStore"

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
        const data = await refreshTokenForImpersonation(refreshToken)

        // Role correction: force Vendor if null
        const userObj = {
          ...data,
          roleName: data.roleName || "Vendor",
        }

        setAuth(userObj as any, data.accessToken, (data.refreshToken as string | undefined) || refreshToken, true)

        toast.success("Logged in as Vendor (Admin Impersonation)", {
          description: "You are currently viewing this account as an administrator.",
          duration: 5000,
        })

        router.push("/vendor-dashboard")
      } catch (error) {
        console.error("Impersonation error:", error)
        toast.error(error instanceof Error ? error.message : "An error occurred during impersonation")
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
