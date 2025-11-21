"use client"

import { usePathname } from "next/navigation"
import Navbar from "./navbar"

const ConditionalNavbar = () => {
  const pathname = usePathname()
  const isDashboard =
    pathname?.startsWith("/buyer-dashboard") ||
    pathname?.startsWith("/vendor-dashboard") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/verify-email") ||
    pathname?.startsWith("/forgot-password")

  if (isDashboard) {
    return null
  }

  return <Navbar />
}

export default ConditionalNavbar
