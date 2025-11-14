"use client"

import { usePathname } from "next/navigation"
import Footer from "./footer"

const ConditionalFooter = () => {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith("/buyer-dashboard")

  if (isDashboard) {
    return null
  }

  return <Footer />
}

export default ConditionalFooter
