"use client"

import { CalendarClock, Loader2, Repeat } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { formatDateOnly } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import EmptyStateCard from "@/components/feedback/EmptyStateCard"
import { showToast } from "@/components/ui/Toast"
import type { AutoOrder } from "@/lib/api/auto-orders"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { cn } from "@/lib/utils"
import AutoOrderCard from "./components/AutoOrderCard"
import AutoOrderEditModal from "./components/AutoOrderEditModal"
import AutoOrderReadinessBanner from "./components/AutoOrderReadinessBanner"
import { type AutoOrderFilter, useAutoOrders } from "./hooks/useAutoOrders"

const FILTERS: { value: AutoOrderFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
]

export default function BuyerAutoOrdersPage() {
  const router = useRouter()
  const { autoOrders, isLoading, readiness, pendingId, updateAutoOrder, deleteAutoOrder } = useAutoOrders()

  const [filter, setFilter] = useState<AutoOrderFilter>("all")
  const [editing, setEditing] = useState<AutoOrder | null>(null)
  const [deleting, setDeleting] = useState<AutoOrder | null>(null)

  const activeCount = autoOrders.filter((item) => item.active).length

  const visibleAutoOrders = useMemo(() => {
    const filtered = autoOrders.filter((item) => {
      if (filter === "active") return item.active
      if (filter === "paused") return !item.active
      return true
    })

    // Soonest deliveries first; paused ones sink to the bottom
    return [...filtered].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      return a.nextOrderDate.localeCompare(b.nextOrderDate)
    })
  }, [autoOrders, filter])

  const nextDelivery = useMemo(() => {
    const upcoming = autoOrders.filter((item) => item.active)
    if (upcoming.length === 0) return null
    return upcoming.reduce((soonest, item) => (item.nextOrderDate < soonest.nextOrderDate ? item : soonest))
  }, [autoOrders])

  const handleToggleActive = async (autoOrder: AutoOrder) => {
    const nextActive = !autoOrder.active
    const succeeded = await updateAutoOrder(autoOrder.id, { active: nextActive })
    if (succeeded) {
      showToast.success(nextActive ? "Auto order resumed" : "Auto order paused")
    }
  }

  const handleSaveEdit = async (autoOrderId: string, quantity: number, period: AutoOrderPeriod) => {
    const succeeded = await updateAutoOrder(autoOrderId, { quantity, period })
    if (succeeded) {
      showToast.success("Auto order updated")
      setEditing(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    const succeeded = await deleteAutoOrder(deleting.id)
    if (succeeded) {
      showToast.success("Auto order removed")
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Auto Orders</h1>
            <p className="mt-2 max-w-3xl text-text-secondary">
              Supplies you buy on a schedule. We place the order for you and charge your auto order card, then ship to
              your primary address.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border-soft bg-surface p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">
              <Repeat className="h-5 w-5 text-brand" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Active schedules</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{activeCount}</p>
            <p className="mt-1 text-xs text-text-secondary">{autoOrders.length - activeCount} paused</p>
          </article>
          <article className="rounded-xl border border-border-soft bg-surface p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">
              <CalendarClock className="h-5 w-5 text-brand" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Next delivery</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {nextDelivery ? formatDateOnly(nextDelivery.nextOrderDate) : "—"}
            </p>
            <p className="mt-1 truncate text-xs text-text-secondary">
              {nextDelivery?.productName ?? "Nothing scheduled"}
            </p>
          </article>
        </div>
      </section>

      <AutoOrderReadinessBanner readiness={readiness} />

      <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-text-primary">Your schedules</h2>
          <div className="flex gap-1 rounded-full bg-surface-muted p-1">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === option.value
                    ? "bg-surface-elevated text-brand shadow-soft"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : autoOrders.length === 0 ? (
          <EmptyStateCard
            title="No auto orders yet"
            description="Turn on Auto-reorder for an item in your cart, and it will show up here after your order is paid."
            actionLabel="Browse products"
            onAction={() => router.push("/products")}
          />
        ) : visibleAutoOrders.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-muted">
            No {filter} auto orders. Switch the filter to see the rest.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleAutoOrders.map((autoOrder) => (
              <AutoOrderCard
                key={autoOrder.id}
                autoOrder={autoOrder}
                isPending={pendingId === autoOrder.id}
                canActivate={readiness.isReady}
                onEdit={setEditing}
                onToggleActive={(item) => {
                  void handleToggleActive(item)
                }}
                onRequestDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </section>

      <AutoOrderEditModal
        autoOrder={editing}
        isSaving={Boolean(editing) && pendingId === editing?.id}
        onClose={() => setEditing(null)}
        onSave={(autoOrderId, quantity, period) => {
          void handleSaveEdit(autoOrderId, quantity, period)
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
        title="Remove this auto order?"
        description="We'll stop reordering this item. You can set it up again from your cart whenever you need it."
        confirmText="Remove"
        cancelText="Keep it"
        isDanger
        isLoading={Boolean(deleting) && pendingId === deleting?.id}
      />
    </div>
  )
}
