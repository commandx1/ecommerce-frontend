"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { type VendorOrder, vendorOrdersAPI } from "@/lib/api/vendor-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useAuthStore } from "@/stores/authStore"
import DashboardPanel from "./shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

function getStatusTone(status: string): keyof typeof STATUS_TONE_CLASS_MAP {
  if (status.includes("CANCEL")) return "danger"
  if (status.includes("RETURN")) return "warning"
  if (status === "DELIVERED" || status === "PAYMENT_SUCCESS") return "success"
  return "info"
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "—"
}

function getOrderTotal(order: VendorOrder): number {
  return order.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
}

const VendorRecentOrders = () => {
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!isAuthenticated) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setIsLoading(true)
        const response = await vendorOrdersAPI.getVendorOrders(0, 4, "createdDate", "desc", "ALL", controller.signal)
        setOrders(response.orders)
      } catch {
        if (controller.signal.aborted) return
        setOrders([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchRecentOrders()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isAuthenticated])

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
            <div key={placeholder} className="h-16 animate-pulse rounded-xl bg-surface-muted" />
          ))}
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
