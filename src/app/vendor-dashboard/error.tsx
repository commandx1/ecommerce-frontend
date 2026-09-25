"use client"

import { RootErrorContent } from "@/app/error"

/**
 * Renders inside the dashboard layout's <main>, so the header and sidebar stay on screen. The home
 * link points at the dashboard root rather than "/", a better recovery path for a signed-in vendor.
 */
export default function VendorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center px-6 py-16">
      <RootErrorContent error={error} reset={reset} homeHref="/vendor-dashboard" homeLabel="Back to Dashboard" />
    </div>
  )
}
