import { ChevronDown, ExternalLink, RefreshCw } from "lucide-react"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import type { OrderItem } from "@/lib/api/orders"
import { getFullImageUrl } from "@/lib/api/products"
import { AUTO_ORDER_PERIOD_LABELS, type AutoOrderPeriod } from "@/lib/constants/auto-order"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderConfirmationItemRowProps {
  item: OrderItem
  /**
   * The schedule this line was placed on, when the buyer set it to repeat. `null` means the line
   * repeats but the period did not survive into the confirmation snapshot; `undefined` means it is
   * a one-off purchase.
   */
  autoOrderPeriod?: AutoOrderPeriod | null
  /** The schedule is created by a Stripe webhook, so it can still be in flight on this screen. */
  autoOrderPending?: boolean
}

/** Backend statuses are SCREAMING_SNAKE; render them as words instead of shouting at the buyer. */
function formatStatus(status?: string | null): string {
  if (!status) return ""
  return status
    .replaceAll("_", " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStatusToneClass(status?: string | null): string {
  const normalized = (status ?? "").toUpperCase()
  if (normalized === "DELIVERED" || normalized === "COMPLETED") return "bg-success/12 text-success"
  if (normalized === "CANCELED" || normalized === "CANCELLED" || normalized === "REFUNDED")
    return "bg-danger/12 text-danger"
  return "bg-warning/15 text-warning"
}

function LinkPills({ label, links, tone }: { label: string; links: string[]; tone: "brand" | "success" }) {
  if (!Array.isArray(links) || links.length === 0) return null

  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => (
          <a
            key={link}
            href={link}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tone === "brand"
                ? "bg-brand/12 text-brand hover:bg-brand/20"
                : "bg-success/15 text-success hover:bg-success/25"
            }`}
          >
            {label === "Shipping" ? "Shipping" : "Tracking"} Link {index + 1}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ))}
      </div>
    </div>
  )
}

export default function OrderConfirmationItemRow({
  item,
  autoOrderPeriod,
  autoOrderPending = false,
}: OrderConfirmationItemRowProps) {
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0
  const statusLabel = formatStatus(item.status)
  const isAutoOrder = autoOrderPeriod !== undefined
  // The period comes from the payload that was actually sent, so it is already certain here. Only
  // fall back to the in-flight wording when this snapshot could not name the schedule.
  const scheduleLabel = autoOrderPeriod
    ? AUTO_ORDER_PERIOD_LABELS[autoOrderPeriod]
    : autoOrderPending
      ? "Setting up your repeat order"
      : "Repeats automatically"
  const hasLinks =
    (Array.isArray(item.shippingLink) && item.shippingLink.length > 0) ||
    (Array.isArray(item.trackingLink) && item.trackingLink.length > 0)

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:gap-4 transition-colors hover:bg-surface-muted/60 sm:px-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border-soft bg-surface-elevated">
          <ProductImageWithFallback
            src={getFullImageUrl(item.productCoverPhotoPath)}
            alt={item.productName || "Product image"}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-semibold text-text-primary sm:text-base">
            {item.productName || "Unnamed product"}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-text-secondary">
            <span>
              Qty {quantity} · {formatCurrency(item.price)} each
            </span>
            {statusLabel ? (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusToneClass(item.status)}`}
              >
                {statusLabel}
              </span>
            ) : null}
            {isAutoOrder ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/12 px-2 py-0.5 text-xs font-semibold text-brand">
                <RefreshCw className="h-3 w-3" />
                Auto order
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold text-text-primary sm:text-base">
            {formatCurrency((item.price || 0) * quantity)}
          </span>
          <ChevronDown className="h-4 w-4 text-text-muted transition-transform duration-300 ease-out group-open:rotate-180" />
        </div>
      </summary>

      <div className="grid transition-[grid-template-rows] duration-300 ease-out [grid-template-rows:0fr] group-open:[grid-template-rows:1fr]">
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-5 border-t border-border-soft/70 px-4 pb-5 pt-4 sm:px-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Unit price</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{formatCurrency(item.price)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Quantity</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{quantity}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Line total</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">
                  {formatCurrency((item.price || 0) * quantity)}
                </dd>
              </div>
              {statusLabel ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">Status</dt>
                  <dd className="mt-1 text-sm font-semibold text-text-primary">{statusLabel}</dd>
                </div>
              ) : null}
            </dl>

            {isAutoOrder ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-brand/8 px-3.5 py-3 w-fit">
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <p className="text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">{scheduleLabel}</span>{" "}
                </p>
              </div>
            ) : null}

            {hasLinks ? (
              <div className="space-y-4">
                <LinkPills label="Shipping" links={item.shippingLink} tone="brand" />
                <LinkPills label="Tracking" links={item.trackingLink} tone="success" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </details>
  )
}
