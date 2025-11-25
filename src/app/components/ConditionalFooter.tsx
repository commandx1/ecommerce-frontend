"use client"

import { usePathname } from "next/navigation"
import Footer from "./footer"

const ConditionalFooter = () => {
  const pathname = usePathname()
  const isDashboard =
    pathname?.startsWith("/buyer-dashboard") ||
    pathname?.startsWith("/vendor-dashboard") ||
    pathname?.startsWith("/verify-2fa") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/verify-email") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/login")

  if (isDashboard) {
    return null
  }

  return <Footer />
}

export default ConditionalFooter
