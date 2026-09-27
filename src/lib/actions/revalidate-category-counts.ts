"use server"

import { updateTag } from "next/cache"
import { cookies } from "next/headers"
import { serverRequest } from "@/lib/api/server-request"
import { CATEGORY_COUNTS_TAG } from "@/lib/cache/category-counts"

async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth-storage")
  if (!authCookie) return null

  try {
    let authData: { state?: { accessToken?: string } }
    try {
      authData = JSON.parse(authCookie.value)
    } catch {
      authData = JSON.parse(decodeURIComponent(authCookie.value))
    }
    return authData?.state?.accessToken || null
  } catch {
    return null
  }
}

/**
 * The `auth-storage` cookie is written by the browser and never signed, so its
 * `state.user.roleName` alone proves nothing — a caller could hand-craft a cookie claiming to be a
 * vendor without ever holding a valid session, and use it to purge this tag on every request. The
 * one cheap way to actually authorize the purge is to hand the cookie's access token to the
 * backend and trust *its* answer (`GET /api/users/me`) instead of the client-supplied claim.
 */
async function callerIsVendor(): Promise<boolean> {
  const accessToken = await getAccessTokenFromCookie()
  if (!accessToken) return false

  try {
    const response = await serverRequest("/api/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return false

    const data = (await response.json()) as { roleName?: string }
    return data?.roleName === "Vendor"
  } catch {
    return false
  }
}

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
 * Requires the caller to be an authenticated Vendor, verified against the backend rather than
 * trusted from the unsigned auth cookie (see `callerIsVendor`) — otherwise any caller that merely
 * satisfies the proxy's unsigned-cookie check could purge this shared tag repeatedly. Still safe to
 * call from any client action and safe to no-op on error or on a failed/missing authorization
 * check (a vendor's already-succeeded save/delete/import must never fail because of this).
 */
export async function revalidateCategoryCounts(): Promise<void> {
  try {
    if (!(await callerIsVendor())) {
      return
    }
    updateTag(CATEGORY_COUNTS_TAG)
  } catch (error) {
    console.error("Failed to revalidate category counts:", error)
  }
}
