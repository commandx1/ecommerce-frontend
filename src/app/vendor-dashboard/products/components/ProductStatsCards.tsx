"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { fetchUserProductStats, type ProductStats } from "@/lib/api/vendor-products"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { RING_TONE_CLASS_MAP } from "../../components/shared/dashboardToneMaps"

export type FilterType = "ALL" | "TOTAL" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "LOW_STOCK"

interface ProductStatsCardsProps {
  selectedFilter?: FilterType
  onFilterChange?: (filter: FilterType) => void
}

const PRODUCT_STAT_CONFIG = [
  {
    key: "TOTAL",
    label: "Total Products",
    iconTone: "info",
    valueKey: "totalProducts",
    iconPath: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    key: "ACTIVE",
    label: "Active Products",
    iconTone: "success",
    valueKey: "activeProducts",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "LOW_STOCK",
    label: "Low Stock",
    iconTone: "warning",
    valueKey: "lowStockProducts",
    iconPath:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  {
    key: "OUT_OF_STOCK",
    label: "Out of Stock",
    iconTone: "danger",
    valueKey: "outOfStockProducts",
    iconPath: "M6 18L18 6M6 6l12 12",
  },
  {
    key: "INACTIVE",
    label: "Inactive",
    iconTone: "neutral",
    valueKey: "inactiveProducts",
    iconPath:
      "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
  },
] as const

const ProductStatsCards = ({ selectedFilter = "TOTAL", onFilterChange }: ProductStatsCardsProps) => {
  const router = useRouter()
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { accessToken, isAuthenticated } = useAuthStore()

  const fetchStats = useCallback(async () => {
    if (!accessToken) return

    try {
      setIsLoading(true)
      setError(null)

      const data = await fetchUserProductStats({ accessToken, router })
      setStats(data)
    } catch (err) {
      console.warn("Error fetching product stats:", err)
      // If handleApiError already logged out, no need to show error here
      if (err instanceof Error && err.message.includes("Unauthorized")) {
        return // Logout yapıldı, component unmount olacak
      }
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, router])

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      void fetchStats()
    }
  }, [isAuthenticated, accessToken, fetchStats])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {["total", "active", "low-stock", "out-of-stock", "inactive"].map((type) => (
          <div
            key={`loading-${type}`}
            className="animate-pulse rounded-xl border border-border-soft bg-surface-elevated p-4 shadow-soft"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-surface-muted"></div>
            </div>
            <div className="mb-2 h-8 rounded bg-surface-muted"></div>
            <div className="h-4 rounded bg-surface-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-full rounded-xl border border-danger/20 bg-danger/10 p-4">
          <div className="text-sm text-danger">{error || "Failed to load product statistics"}</div>
        </div>
      </div>
    )
  }

  const handleCardClick = (filter: FilterType) => {
    if (onFilterChange) {
      onFilterChange(filter)
    }
  }

  const getCardClasses = (filter: FilterType) => {
    const baseClasses =
      "w-full cursor-pointer rounded-xl border bg-surface-elevated p-4 text-left shadow-soft transition-all hover:border-brand/35 hover:bg-surface-muted/60"
    const selectedClasses = selectedFilter === filter ? "border-brand ring-2 ring-brand/20" : "border-border-soft"
    return `${baseClasses} ${selectedClasses}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {PRODUCT_STAT_CONFIG.map((item) => {
        const value = stats[item.valueKey]
        const iconToneClass =
          item.iconTone === "success"
            ? RING_TONE_CLASS_MAP.success
            : item.iconTone === "warning"
              ? RING_TONE_CLASS_MAP.warning
              : item.iconTone === "danger"
                ? RING_TONE_CLASS_MAP.danger
                : item.iconTone === "info"
                  ? RING_TONE_CLASS_MAP.info
                  : RING_TONE_CLASS_MAP.neutral

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleCardClick(item.key)}
            className={getCardClasses(item.key)}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", iconToneClass)}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={item.label}>
                  <title>{item.label}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-text-primary">{value}</div>
            <div className="text-sm text-text-secondary">{item.label}</div>
          </button>
        )
      })}
    </div>
  )
}

export default ProductStatsCards
