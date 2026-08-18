"use client"

import { Edit3, LoaderCircle, Repeat, ShieldCheck, Trash2 } from "lucide-react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { SavedPaymentMethod } from "../paymentMethodsData"

const methodToneMap: Record<SavedPaymentMethod["type"], string> = {
  visa: "bg-brand/15 text-brand",
  mastercard: "bg-warning/18 text-warning",
  amex: "bg-success/15 text-success",
  bank: "bg-surface-muted text-text-secondary",
}

interface PaymentMethodCardProps {
  method: SavedPaymentMethod
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
}

function StatusTag({ status }: { status: SavedPaymentMethod["status"] }) {
  const tone =
    status === "default"
      ? "bg-success/15 text-success"
      : status === "backup"
        ? "bg-warning/15 text-warning"
        : "bg-surface-muted text-text-secondary"

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", tone)}>
      {status === "default" ? "Default" : status === "backup" ? "Backup" : "Active"}
    </span>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-text-secondary">{value}</p>
    </div>
  )
}

const IconButton = React.forwardRef<HTMLButtonElement, { icon: React.ReactNode; onClick: () => void; label: string }>(
  ({ icon, onClick, label }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft text-text-muted transition-colors hover:text-brand"
    >
      {icon}
    </button>
  ),
)
IconButton.displayName = "IconButton"

function ButtonSpinner({ show }: { show: boolean }) {
  return (
    <div
      className={cn(
        "absolute left-2.5 -translate-x-2 opacity-0 transition-all duration-200 ease-in-out",
        show && "translate-x-0 opacity-100",
      )}
    >
      <LoaderCircle className="animate-spin" size={12} strokeWidth={2} aria-hidden="true" />
    </div>
  )
}

export default function PaymentMethodCard({
  method,
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
}: PaymentMethodCardProps) {
  const isDeleting = deletingId === method.id
  const isSettingDefault = settingDefaultId === method.id
  const isUpgrading = upgradingId === method.id
  const isTogglingAutoOrder = autoOrderCardActionId === method.id

  return (
    <article
      className={cn(
        "rounded-xl border bg-surface-elevated p-5",
        method.autoOrderCard ? "border-brand" : method.status === "default" ? "border-success" : "border-border-soft",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", methodToneMap[method.type])}>
              {method.brandLabel}
            </span>
            <StatusTag status={method.status} />
            {method.autoOrderCard ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
                <Repeat className="h-3 w-3" />
                Auto order card
              </span>
            ) : null}
            {method.openToAutoPayment ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                <ShieldCheck className="h-3 w-3" />
                Auto payments on
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-text-primary">{method.nickname}</h3>
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Rename" onClick={() => onRename(method)} icon={<Edit3 className="h-4 w-4" />} />
          <Popover
            open={deletePopoverOpenId === method.id}
            onOpenChange={(open) => setDeletePopoverOpenId(open ? method.id : null)}
          >
            <PopoverTrigger asChild>
              <IconButton label="Remove" onClick={() => {}} icon={<Trash2 className="h-4 w-4" />} />
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64 p-4">
              <p className="text-sm font-semibold text-text-primary">Remove card?</p>
              <p className="mt-1 text-xs text-text-secondary">
                {method.brandLabel} •••• {method.last4} will be permanently deleted.
              </p>
              {method.autoOrderCard ? (
                <p className="mt-2 rounded-md bg-warning/10 px-2 py-1.5 text-xs text-warning">
                  This is your auto order card — removing it pauses all of your active auto orders.
                </p>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setDeletePopoverOpenId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => onRemove(method)}
                  className={cn("relative transition-[padding] duration-200", isDeleting && "pl-7")}
                >
                  <ButtonSpinner show={isDeleting} />
                  Remove
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Meta label="Card" value={`•••• ${method.last4}`} />
        <Meta label="Expiry" value={`${method.expiryMonth}/${method.expiryYear}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {method.status !== "default" ? (
          <Popover
            open={defaultPopoverOpenId === method.id}
            onOpenChange={(open) => setDefaultPopoverOpenId(open ? method.id : null)}
          >
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Set as Default
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64 p-4">
              <p className="text-sm font-semibold text-text-primary">Set as default?</p>
              <p className="mt-1 text-xs text-text-secondary">
                {method.brandLabel} •••• {method.last4} will be used for all future invoices.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  disabled={isSettingDefault}
                  onClick={() => setDefaultPopoverOpenId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSettingDefault}
                  onClick={() => onSetDefault(method)}
                  className={cn("relative transition-[padding] duration-200", isSettingDefault && "pl-7")}
                >
                  <ButtonSpinner show={isSettingDefault} />
                  OK
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            Default Card
          </Button>
        )}

        {!method.openToAutoPayment ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUpgrading}
            onClick={() => onEnableAutoPayments(method)}
            className={cn("relative transition-[padding] duration-200", isUpgrading && "pl-7")}
          >
            <ButtonSpinner show={isUpgrading} />
            Enable automatic payments
          </Button>
        ) : method.autoOrderCard ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAutoOrder}
            onClick={() => onRequestStopAutoOrders(method)}
            className={cn("relative transition-[padding] duration-200", isTogglingAutoOrder && "pl-7")}
          >
            <ButtonSpinner show={isTogglingAutoOrder} />
            Stop using for auto orders
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAutoOrder}
            onClick={() => onUseForAutoOrders(method)}
            className={cn("relative transition-[padding] duration-200", isTogglingAutoOrder && "pl-7")}
          >
            <ButtonSpinner show={isTogglingAutoOrder} />
            Use for auto orders
          </Button>
        )}
      </div>

      {!method.openToAutoPayment ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="mt-3 w-fit cursor-help text-xs text-text-muted underline decoration-dotted underline-offset-4">
              Why can't I use this card for auto orders?
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Auto orders are charged while you're away, which needs a one-time re-authorisation with your bank. Enable
            automatic payments to allow it.
          </TooltipContent>
        </Tooltip>
      ) : null}
    </article>
  )
}
