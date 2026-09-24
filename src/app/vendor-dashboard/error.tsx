"use client"

import { RootErrorContent } from "@/app/error"

/**
 * Scoped to the vendor-dashboard segment, so it renders inside VendorDashboardLayout's <main> -
 * the header and sidebar chrome the layout already painted stay on screen around this, only the
 * content area falls back to the error card. Reuses RootErrorContent for the same visuals and
 * digest logging as the root boundary (app/error.tsx), with the home link pointed at the
 * dashboard root instead of "/" since bouncing a signed-in vendor out to the storefront would be
 * a worse recovery path than sending them back to their own dashboard.
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
