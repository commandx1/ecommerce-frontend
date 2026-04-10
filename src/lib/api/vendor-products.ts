"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { apiRequest } from "@/lib/api/request"

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
  void params.router

  return apiRequest.requestJson<ProductStats>({
    client: "app",
    method: "GET",
    url: "/api/user-products/stats",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
    fallbackMessage: "Failed to fetch product stats",
  })
}
