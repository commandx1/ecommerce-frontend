"use server"

import { updateTag } from "next/cache"
import { CATEGORY_COUNTS_TAG } from "@/lib/cache/category-counts"

/**
 * On-demand half of the category-counts cache's hybrid strategy: fired (fire-and-forget) right
 * after a vendor product create/update/delete/import succeeds, so the storefront doesn't have to
 * wait out the 15-minute TTL to reflect it.
 *
 * `updateTag` (not `revalidateTag`) because we're always called from a Server Action here and it
 * gives immediate read-your-own-writes expiration with no deprecation warning; `revalidateTag`
 * would need a `cacheLife` profile as its second argument, and any profile other than "no profile"
 * makes the purge stale-while-revalidate rather than immediate.
 *
 * Takes no arguments and reveals nothing about the caller — it only ever purges this one fixed
 * tag — so it's safe to call from any authenticated client action, and safe to no-op on error
 * (a vendor's already-succeeded save/delete/import must never fail because of this).
 */
export async function revalidateCategoryCounts(): Promise<void> {
  try {
    updateTag(CATEGORY_COUNTS_TAG)
  } catch (error) {
    console.error("Failed to revalidate category counts:", error)
  }
}
