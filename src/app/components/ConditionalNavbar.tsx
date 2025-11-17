"use client"

import { usePathname } from "next/navigation"
import Navbar from "./navbar"

const ConditionalNavbar = () => {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith("/buyer-dashboard") || pathname?.startsWith("/vendor-dashboard")

  if (isDashboard) {
    return null
  }

  return <Navbar />
}

export default ConditionalNavbar
