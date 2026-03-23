import type { Metadata } from "next"
import ForgotPasswordPage from "@/features/forgot-password/ForgotPasswordPage"

export const metadata: Metadata = {
  title: "Forgot Password",
}

export default function ForgotPassword() {
  return <ForgotPasswordPage />
}
