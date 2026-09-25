"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import DashboardPanel from "@/app/vendor-dashboard/components/shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP } from "@/app/vendor-dashboard/components/shared/dashboardToneMaps"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getFullImageUrl } from "@/lib/api/products"
import { useInventoryStatusQuery } from "../hooks/useOverviewQueries"

const CRITICAL_STOCK_THRESHOLD = 5
const PLACEHOLDER_IMAGE = "/dentypro-product-placeholder.png"
const SKELETON_ROW_IDS = ["row-1", "row-2", "row-3"] as const

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
    text: "text-warning-strong",
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
  warning: "text-warning-strong",
}

const InventoryStatus = () => {
  const { isLoading, fetchError, statusRows, criticalAlerts, refetch } = useInventoryStatusQuery()
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})

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
          {SKELETON_ROW_IDS.map((id) => (
            <Skeleton key={id} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-medium text-danger">Couldn't load inventory status. Please try again.</p>
          <Button type="button" variant="outline" onClick={refetch} className="rounded-lg px-4">
            Retry
          </Button>
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
                      {/* Singular only for exactly one; "0 products" is the correct English. */}
                      <div className="text-sm text-text-secondary">
                        {row.bucket.count} product{row.bucket.count === 1 ? "" : "s"}
                      </div>
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
              {/* An empty list under the heading used to render as blank space, which reads like
                  the panel failed to load rather than "there is nothing to report". */}
              {criticalAlerts.length === 0 ? (
                <p className="text-sm text-text-secondary">No critical stock alerts right now.</p>
              ) : (
                criticalAlerts.map((alert) => {
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
                })
              )}
            </div>
          </div>
        </>
      )}
    </DashboardPanel>
  )
}

export default InventoryStatus
