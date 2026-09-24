import DashboardContentSkeleton from "@/components/dashboard-shared/DashboardContentSkeleton"

/**
 * VendorDashboardLayout is a client component that already renders its own full-page skeleton
 * (VendorDashboardLayoutSkeleton, header + sidebar + content) while it resolves the auth check -
 * `children`, and therefore this loading.tsx, do not mount until that check passes. By the time
 * this can show, the layout has already swapped in its real header and sidebar, so this only
 * needs to stand in for the <main> content area.
 *
 * Worded to differ from both VendorDashboardLayoutSkeleton's "Loading Vendor Dashboard" and the
 * real overview page's "Vendor Dashboard" (DashboardHeader), so a test waiting on an exact
 * accessible name can't resolve early against this transient node - same footgun
 * VendorDashboardLayoutSkeleton already guards against.
 */
export default function VendorDashboardLoading() {
  return <DashboardContentSkeleton label="Loading Vendor Dashboard Content" />
}
