"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import DashboardPanel from "@/app/vendor-dashboard/components/shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "@/app/vendor-dashboard/components/shared/dashboardToneMaps"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { type VendorOrder, vendorOrdersAPI } from "@/lib/api/vendor-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useAuthStore } from "@/stores/authStore"

function getStatusTone(status: string): keyof typeof STATUS_TONE_CLASS_MAP {
  if (status.includes("CANCEL")) return "danger"
  if (status.includes("RETURN")) return "warning"
  if (status === "DELIVERED" || status === "PAYMENT_SUCCESS") return "success"
  return "info"
}

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
  return `${(firstName ?? "").charAt(0)}${(lastName ?? "").charAt(0)}`.toUpperCase() || "—"
}

function getOrderTotal(order: VendorOrder): number {
  // `orderItems` missing, null, or not an array on an otherwise-valid order (malformed 200 body)
  // would otherwise throw on `.reduce` and blank the whole dashboard (infra note #26).
  if (!Array.isArray(order.orderItems)) return 0
  return order.orderItems.reduce((sum, item) => sum + (Number.isFinite(item.totalPrice) ? item.totalPrice : 0), 0)
}

const VendorRecentOrders = () => {
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchRecentOrders = useCallback(async () => {
    if (!isAuthenticated) return

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setIsLoading(true)
      setFetchError(false)
      const response = await vendorOrdersAPI.getVendorOrders(0, 4, "createdDate", "desc", "ALL", controller.signal)
      // Guard against a malformed 200 body — `orders` missing, null, or not an array would
      // otherwise throw on `.map` and blank the whole dashboard (infra note #26).
      setOrders(Array.isArray(response.orders) ? response.orders : [])
    } catch {
      if (controller.signal.aborted) return
      setOrders([])
      setFetchError(true)
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    void fetchRecentOrders()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchRecentOrders])

  return (
    <DashboardPanel
      title="Recent Orders"
      action={
        <Link href="/vendor-dashboard/orders" className="text-sm text-brand transition-colors hover:text-brand-strong">
          View All Orders
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((placeholder) => (
            <Skeleton key={placeholder} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-medium text-danger">Couldn't load recent orders. Please try again.</p>
          <Button type="button" variant="outline" onClick={() => void fetchRecentOrders()} className="rounded-lg px-4">
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const tone = STATUS_TONE_CLASS_MAP[getStatusTone(order.orderStatus)]

            return (
              <div
                key={order.orderId}
                className="flex items-center justify-between rounded-xl border border-border-soft p-4"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-primary-foreground">
                    <span className="text-sm font-semibold">{getInitials(order.buyerName, order.buyerSurname)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {order.buyerName} {order.buyerSurname}
                    </div>
                    <div className="text-sm text-text-secondary">Order #{order.orderId.slice(0, 8)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-text-primary">{formatCurrency(getOrderTotal(order))}</div>
                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${tone}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardPanel>
  )
}

export default VendorRecentOrders
