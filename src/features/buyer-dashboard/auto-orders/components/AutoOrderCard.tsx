"use client"

import { CalendarClock, Loader2, Pause, Pencil, Play, Repeat, Trash2 } from "lucide-react"
import { formatDateOnly } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import type { AutoOrder } from "@/lib/api/auto-orders"
import { getFullImageUrl } from "@/lib/api/products"
import { AUTO_ORDER_PERIOD_LABELS } from "@/lib/constants/auto-order"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import { describeNextOrderDate } from "../lib/auto-order-view-utils"

interface AutoOrderCardProps {
  autoOrder: AutoOrder
  isPending: boolean
  /** Resuming is blocked until the buyer has a primary address and an auto order card. */
  canActivate: boolean
  onEdit: (autoOrder: AutoOrder) => void
  onToggleActive: (autoOrder: AutoOrder) => void
  onRequestDelete: (autoOrder: AutoOrder) => void
}

export default function AutoOrderCard({
  autoOrder,
  isPending,
  canActivate,
  onEdit,
  onToggleActive,
  onRequestDelete,
}: AutoOrderCardProps) {
  const imageSrc = getFullImageUrl(autoOrder.productCoverPhotoPath) || "/dentypro-product-placeholder.png"
  const relativeDate = describeNextOrderDate(autoOrder.nextOrderDate)
  const isResumeBlocked = !autoOrder.active && !canActivate

  const resumeButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending || isResumeBlocked}
      onClick={() => onToggleActive(autoOrder)}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      Resume
    </Button>
  )

  return (
    <article
      className={cn(
        "rounded-xl border bg-surface-elevated p-5",
        autoOrder.active ? "border-border-soft" : "border-dashed border-border-strong",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface ring-1 ring-border-soft/50">
          <ProductImageWithFallback
            src={imageSrc}
            alt={autoOrder.productName ?? "Product"}
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
              <Repeat className="h-3 w-3" />
              {AUTO_ORDER_PERIOD_LABELS[autoOrder.period]}
            </span>
            {!autoOrder.active ? (
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted">
                Paused
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 truncate text-base font-semibold text-text-primary">
            {autoOrder.productName ?? "Product no longer available"}
          </h3>
          {autoOrder.sellerName ? <p className="text-sm text-text-muted">Sold by {autoOrder.sellerName}</p> : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-text-secondary">
              <span className="font-semibold text-text-primary">{formatCurrency(autoOrder.price)}</span> ×{" "}
              {autoOrder.quantity} ={" "}
              <span className="font-semibold text-text-primary">
                {formatCurrency(autoOrder.price * autoOrder.quantity)}
              </span>
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                autoOrder.active ? "text-text-secondary" : "text-text-muted",
              )}
            >
              <CalendarClock className="h-4 w-4" />
              {autoOrder.active ? (
                <>
                  Next order {formatDateOnly(autoOrder.nextOrderDate)}
                  {relativeDate ? <span className="text-text-muted">({relativeDate})</span> : null}
                </>
              ) : (
                <>Resumes {formatDateOnly(autoOrder.nextOrderDate)} once you turn it back on</>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => onEdit(autoOrder)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        {autoOrder.active ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onToggleActive(autoOrder)}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
            Pause
          </Button>
        ) : isResumeBlocked ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{resumeButton}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Set a primary address and pick a card for auto orders before resuming.
            </TooltipContent>
          </Tooltip>
        ) : (
          resumeButton
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => onRequestDelete(autoOrder)}
          className="text-danger hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
    </article>
  )
}
