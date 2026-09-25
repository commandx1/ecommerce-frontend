"use client"

import { CalendarClock, Repeat } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import EmptyStateCard from "@/components/feedback/EmptyStateCard"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/Toast"
import type { AutoOrder } from "@/lib/api/auto-orders"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { formatDateOnly } from "@/lib/orders/order-format"
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
      <SurfaceCard as="section" variant="glass" className="p-6">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Auto Orders"
          description="Supplies you buy on a schedule. We place the order for you and charge your auto order card, then ship to your primary address."
        />

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
      </SurfaceCard>

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
          <div aria-busy="true" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <span className="sr-only">Loading auto orders...</span>
            {[0, 1].map((i) => (
              <article key={i} className="rounded-xl border border-border-soft bg-surface-elevated p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-8 w-24 rounded-lg" />
                  ))}
                </div>
              </article>
            ))}
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
