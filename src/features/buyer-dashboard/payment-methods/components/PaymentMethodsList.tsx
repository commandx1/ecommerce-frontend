import { Skeleton } from "@/components/ui/skeleton"
import type { SavedPaymentMethod } from "../paymentMethodsData"
import PaymentMethodCard from "./PaymentMethodCard"

function PaymentMethodsListSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <span className="sr-only">Loading payment methods...</span>
      {[0, 1].map((i) => (
        <article key={i} className="rounded-xl border border-border-soft bg-surface-elevated p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-6 w-40" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            {[0, 1, 2].map((k) => (
              <Skeleton key={k} className="h-8 w-28 rounded-lg" />
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

export default function PaymentMethodsList({
  isLoading,
  methods,
  deletingId,
  settingDefaultId,
  upgradingId,
  autoOrderCardActionId,
  deletePopoverOpenId,
  defaultPopoverOpenId,
  setDeletePopoverOpenId,
  setDefaultPopoverOpenId,
  onRename,
  onRemove,
  onSetDefault,
  onEnableAutoPayments,
  onUseForAutoOrders,
  onRequestStopAutoOrders,
}: {
  isLoading: boolean
  methods: SavedPaymentMethod[]
  deletingId: string | null
  settingDefaultId: string | null
  upgradingId: string | null
  autoOrderCardActionId: string | null
  deletePopoverOpenId: string | null
  defaultPopoverOpenId: string | null
  setDeletePopoverOpenId: (id: string | null) => void
  setDefaultPopoverOpenId: (id: string | null) => void
  onRename: (method: SavedPaymentMethod) => void
  onRemove: (method: SavedPaymentMethod) => void
  onSetDefault: (method: SavedPaymentMethod) => void
  onEnableAutoPayments: (method: SavedPaymentMethod) => void
  onUseForAutoOrders: (method: SavedPaymentMethod) => void
  onRequestStopAutoOrders: (method: SavedPaymentMethod) => void
}) {
  return (
    <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Saved Cards</h2>
        <span className="text-sm text-text-muted">
          {isLoading ? <Skeleton className="h-4 w-14" /> : `${methods.length} cards`}
        </span>
      </div>

      {isLoading ? (
        <PaymentMethodsListSkeleton />
      ) : methods.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No saved cards yet. Add a card to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              deletingId={deletingId}
              settingDefaultId={settingDefaultId}
              upgradingId={upgradingId}
              autoOrderCardActionId={autoOrderCardActionId}
              deletePopoverOpenId={deletePopoverOpenId}
              defaultPopoverOpenId={defaultPopoverOpenId}
              setDeletePopoverOpenId={setDeletePopoverOpenId}
              setDefaultPopoverOpenId={setDefaultPopoverOpenId}
              onRename={onRename}
              onRemove={onRemove}
              onSetDefault={onSetDefault}
              onEnableAutoPayments={onEnableAutoPayments}
              onUseForAutoOrders={onUseForAutoOrders}
              onRequestStopAutoOrders={onRequestStopAutoOrders}
            />
          ))}
        </div>
      )}
    </section>
  )
}
