import type { Metadata } from "next"
import LoginPage from "@/features/login/LoginPage"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function Login() {
  return <LoginPage />
}
