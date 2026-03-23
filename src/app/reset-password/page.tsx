import type { Metadata } from "next"
import ResetPasswordPage from "@/features/reset-password/ResetPasswordPage"

export const metadata: Metadata = {
  title: "Reset Password",
}

export default function ResetPassword() {
  return <ResetPasswordPage />
}
