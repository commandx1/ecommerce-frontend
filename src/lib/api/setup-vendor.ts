"use client"

import { refreshTokenForImpersonation, type ImpersonationRefreshResponse } from "./impersonation"

export async function refreshTokenForVendorSetup(refreshToken: string): Promise<ImpersonationRefreshResponse> {
  // Same endpoint/shape; separated name for clarity in call sites
  return refreshTokenForImpersonation(refreshToken)
}

