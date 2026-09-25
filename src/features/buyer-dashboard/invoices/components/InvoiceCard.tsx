import { Download, Eye, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { formatLongDate } from "@/lib/helpers/format"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import type { BuyerInvoice, InvoiceStatus } from "../invoicesData"
import ActionIconButton from "./ActionIconButton"
import InvoiceMeta from "./InvoiceMeta"

const statusPillMap: Record<InvoiceStatus, string> = {
  Paid: "bg-success/15 text-success border border-success/30",
  Pending: "bg-warning/15 text-warning border border-warning/30",
  // Text on the danger tint - the exact case `--danger-strong` was measured and added for.
  Overdue: "bg-danger/15 text-danger-strong border border-danger/30",
  Disputed: "bg-brand/15 text-brand border border-brand/30",
}

const statusNoteMap: Record<InvoiceStatus, string> = {
  Paid: "text-success",
  Pending: "text-warning",
  // Body text, so it needs `--danger-strong`; `--danger` is the fill/icon red and measures
  // 3.42:1 as text (globals.css:146, which added `--danger-strong` for exactly this).
  Overdue: "text-danger-strong",
  Disputed: "text-brand",
}

export default function InvoiceCard({
  invoice,
  selected,
  onToggleSelect,
}: {
  invoice: BuyerInvoice
  selected: boolean
  onToggleSelect: () => void
}) {
  return (
    <SurfaceCard as="article" variant="glass" className="rounded-xl p-5 transition-shadow hover:shadow-panel">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-4">
          <input
            type="checkbox"
            aria-label={`Select invoice ${invoice.id}`}
            className="mt-1 h-4 w-4 rounded border-border-soft text-brand focus:ring-0"
            checked={selected}
            onChange={onToggleSelect}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-text-primary">Invoice #{invoice.id}</span>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusPillMap[invoice.status])}>
                {invoice.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {invoice.supplier} • {formatLongDate(invoice.issueDate)}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <InvoiceMeta label="Items" value={invoice.itemsSummary} />
              <InvoiceMeta label="Payment Method" value={invoice.paymentMethod} />
              <InvoiceMeta label="Due Date" value={formatLongDate(invoice.dueDate)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 xl:justify-end">
          <div className="text-left xl:text-right">
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(invoice.amount)}</p>
            <p className={cn("text-sm", statusNoteMap[invoice.status])}>{invoice.statusNote}</p>
          </div>
          <div className="flex items-center gap-2">
            <ActionIconButton icon={<Download className="h-4 w-4" />} label="Download PDF" />
            <ActionIconButton icon={<Eye className="h-4 w-4" />} label="View Details" />
            <ActionIconButton icon={<MoreVertical className="h-4 w-4" />} label="More Actions" />
            {invoice.status === "Pending" || invoice.status === "Overdue" ? (
              <Button type="button" size="sm">
                Pay Now
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </SurfaceCard>
  )
}
