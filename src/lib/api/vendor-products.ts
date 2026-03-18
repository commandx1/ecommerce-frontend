"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { handleApiError } from "@/lib/utils/api-error-handler"

export interface ProductStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  outOfStockProducts: number
  lowStockProducts: number
}

export async function fetchUserProductStats(params: {
  accessToken: string
  router: AppRouterInstance
}): Promise<ProductStats> {
  const response = await fetch("/api/user-products/stats", {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
  })

  await handleApiError(response, params.router)
  return response.json()
}

