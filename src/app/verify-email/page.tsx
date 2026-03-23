import type { Metadata } from "next"
import { Suspense } from "react"
import VerifyEmailSkeleton from "@/features/verify-email/components/VerifyEmailSkeleton"
import VerifyEmailPage from "@/features/verify-email/VerifyEmailPage"

export const metadata: Metadata = {
  title: "Verify Email",
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailPage />
    </Suspense>
  )
}
