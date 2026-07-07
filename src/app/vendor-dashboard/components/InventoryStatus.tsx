"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getFullImageUrl } from "@/lib/api/products"
import { type VendorStockSummaryResponse, vendorDashboardAPI } from "@/lib/api/vendor-dashboard"
import { useAuthStore } from "@/stores/authStore"
import DashboardPanel from "./shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const CRITICAL_STOCK_THRESHOLD = 5
const PLACEHOLDER_IMAGE = "/dentypro-product-placeholder.png"

const colorMap = {
  green: {
    bg: "bg-success/10",
    border: "border-success/20",
    text: "text-success",
    dot: DOT_TONE_CLASS_MAP.success,
  },
  yellow: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    text: "text-warning",
    dot: DOT_TONE_CLASS_MAP.warning,
  },
  red: {
    bg: "bg-danger/10",
    border: "border-danger/20",
    text: "text-danger",
    dot: DOT_TONE_CLASS_MAP.danger,
  },
} as const

const statusColorMap: Record<string, string> = {
  critical: "text-danger",
  warning: "text-warning",
}

const InventoryStatus = () => {
  const { isAuthenticated } = useAuthStore()
  const [summary, setSummary] = useState<VendorStockSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchStockSummary = async () => {
      if (!isAuthenticated) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setIsLoading(true)
        const response = await vendorDashboardAPI.getStockSummary(0, 3, controller.signal)
        setSummary(response)
      } catch {
        if (controller.signal.aborted) return
        setSummary(null)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchStockSummary()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isAuthenticated])

  const statusRows = summary
    ? [
        { key: "inStock", label: "In Stock", color: "green" as const, bucket: summary.inStock, filterType: "ACTIVE" },
        {
          key: "lowStock",
          label: "Low Stock",
          color: "yellow" as const,
          bucket: summary.lowStock,
          filterType: "LOW_STOCK",
        },
        {
          key: "outOfStock",
          label: "Out of Stock",
          color: "red" as const,
          bucket: summary.outOfStock,
          filterType: "OUT_OF_STOCK",
        },
      ]
    : []

  return (
    <DashboardPanel
      title="Inventory Status"
      action={
        <Button type="button" size="sm" className="rounded-lg px-3">
          Manage Inventory
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((placeholder) => (
            <div key={placeholder} className="h-16 animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {statusRows.map((row) => {
              const colors = colorMap[row.color]

              return (
                <Link
                  key={row.key}
                  href={`/vendor-dashboard/products?filter=${row.filterType}`}
                  className={`flex items-center justify-between p-4 ${colors.bg} rounded-xl border ${colors.border} transition-opacity hover:opacity-80`}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${colors.dot} rounded-full mr-3`}></div>
                    <div>
                      <div className="font-medium text-text-primary">{row.label}</div>
                      <div className="text-sm text-text-secondary">{row.bucket.count} products</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${colors.text}`}>{Math.round(row.bucket.percentage)}%</div>
                </Link>
              )
            })}
          </div>

          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-text-primary">Critical Stock Alerts</h3>
            <div className="space-y-2">
              {(summary?.criticStockAlerts.content ?? []).map((alert) => {
                const status = alert.stock <= CRITICAL_STOCK_THRESHOLD ? "critical" : "warning"
                const imageSrc = imageFallbacks[alert.userProductId]
                  ? PLACEHOLDER_IMAGE
                  : getFullImageUrl(alert.coverPhotoPath) || PLACEHOLDER_IMAGE

                return (
                  <Link
                    key={alert.userProductId}
                    href={`/vendor-dashboard/products?userProductId=${alert.userProductId}`}
                    className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-muted/70 px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={imageSrc}
                        alt={alert.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-md border border-border-soft object-contain"
                        onError={() => setImageFallbacks((prev) => ({ ...prev, [alert.userProductId]: true }))}
                      />
                      <span className="text-text-secondary">{alert.name}</span>
                    </div>
                    <span className={`${statusColorMap[status]} font-medium whitespace-nowrap`}>
                      {alert.stock} left
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </DashboardPanel>
  )
}

export default InventoryStatus
