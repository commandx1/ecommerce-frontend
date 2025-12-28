"use client"

import { usePathname } from "next/navigation"
import Navbar from "./navbar"

interface ConditionalNavbarProps {
  initialAuthState?: {
    user: {
      id: string
      name: string
      surname: string
      email: string
      roleName?: string
    } | null
    isAuthenticated: boolean
  } | null
}

const ConditionalNavbar = ({ initialAuthState }: ConditionalNavbarProps) => {
  const pathname = usePathname()
  const isDashboard =
    pathname?.startsWith("/buyer-dashboard") ||
    pathname?.startsWith("/vendor-dashboard") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/verify-email") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/verify-2fa") ||
    pathname?.startsWith("/reset-password")

  if (isDashboard) {
    return null
  }

  return <Navbar initialAuthState={initialAuthState} />
}

export default ConditionalNavbar
