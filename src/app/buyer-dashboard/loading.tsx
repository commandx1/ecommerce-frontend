import DashboardContentSkeleton from "@/components/dashboard-shared/DashboardContentSkeleton"

/**
 * BuyerDashboardLayout is a client component that already renders its own full-page skeleton
 * (BuyerDashboardLayoutSkeleton, header + sidebar + content) while it resolves the auth check -
 * `children`, and therefore this loading.tsx, do not mount until that check passes. By the time
 * this can show, the layout has already swapped in its real header and sidebar, so this only
 * needs to stand in for the <main> content area.
 *
 * Worded to differ from both BuyerDashboardLayoutSkeleton's "Buyer Dashboard" and any real
 * nested page's own h1, so a test waiting on an exact accessible name can't resolve early
 * against this transient node.
 */
export default function BuyerDashboardLoading() {
  return <DashboardContentSkeleton label="Loading Buyer Dashboard Content" />
}
