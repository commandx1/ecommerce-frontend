"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import { useMemo } from "react"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import { columnLabel, columnValue, type ImportRow, type ImportRowStatus } from "../lib/document-products-rows"

const PLACEHOLDER_IMAGE = "/dentypro-product-placeholder.png"

const STATUS_LABELS: Record<ImportRowStatus, string> = {
  success: "Imported",
  skip: "Skipped",
  wrong: "Failed",
  unknown: "In file",
}

const STATUS_CLASSES: Record<ImportRowStatus, string> = {
  success: "bg-success/12 text-success",
  skip: "bg-warning/12 text-warning",
  wrong: "bg-danger/10 text-danger",
  unknown: "bg-text-muted/12 text-text-muted",
}

function StatusBadge({ status }: { status: ImportRowStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function RawRowDetails({ raw }: { raw: Record<string, string> }) {
  const filled = Object.entries(raw).filter(([, value]) => value?.trim())

  if (filled.length === 0) {
    return <p className="px-4 py-3 text-xs text-text-muted">No cell values for this row.</p>
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 bg-surface-muted px-4 py-3 text-left text-xs md:grid-cols-3">
      {filled.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="font-semibold text-text-muted">{columnLabel(key)}</dt>
          <dd className="truncate text-text-secondary" title={value}>
            {columnValue(key, value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** `showReasonColumn` is the only real input — everything else is derived per row — so this stays
 * a small `useMemo` (not a `useCallback`-per-cell setup like `products/columns.tsx`): the "Reason"
 * column is either present for the lifetime of one document's rows or it never appears. */
export function useDocumentProductsColumns(showReasonColumn: boolean): Array<ColumnDef<ImportRow, unknown>> {
  return useMemo(() => {
    const base: Array<ColumnDef<ImportRow, unknown>> = [
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "product",
        header: "Product",
        // Capped so a long name cannot stretch the table, but wrapped rather than
        // truncated so the vendor always reads the whole name.
        meta: { cellClassName: "max-w-[18rem]" },
        cell: ({ row }) => (
          <div className="flex max-w-[18rem] items-center gap-3 text-left">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
              <Image
                src={row.original.image || PLACEHOLDER_IMAGE}
                alt={row.original.name}
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="min-w-0 font-medium wrap-break-word text-text-primary">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "sku",
        header: "SKU",
        cell: ({ row }) => <span className="text-text-secondary">{row.original.sku}</span>,
      },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) => <span>{row.original.price === null ? "—" : formatCurrency(row.original.price)}</span>,
      },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => <span>{row.original.stock ?? "—"}</span>,
      },
    ]

    if (showReasonColumn) {
      base.push({
        id: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-left text-xs text-danger" title={row.original.reason ?? ""}>
            {row.original.reason ?? ""}
          </span>
        ),
      })
    }

    base.push({
      id: "details",
      header: "",
      cell: ({ row }) =>
        row.original.raw ? (
          <ChevronDown
            className={cn("h-4 w-4 text-text-muted transition-transform", row.getIsExpanded() && "rotate-180")}
          />
        ) : null,
    })

    return base
  }, [showReasonColumn])
}
