"use client"

import { type ImpersonationRefreshResponse, refreshTokenForImpersonation } from "./impersonation"

export async function refreshTokenForVendorSetup(refreshToken: string): Promise<ImpersonationRefreshResponse> {
  // Same endpoint/shape; separated name for clarity in call sites
  return refreshTokenForImpersonation(refreshToken)
}
