"use client"

import type { ColumnDef, ExpandedState, Row } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"
import { ChevronDown, CircleAlert, CircleCheck, CircleX, Layers, Loader2 } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import { getFullImageUrl } from "@/lib/api/products"
import { type DocumentProductsResponse, vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"

const PLACEHOLDER_IMAGE = "/dentypro-product-placeholder.png"

type ImportRowStatus = "success" | "skip" | "wrong" | "unknown"
type TabValue = "all" | "success" | "skip" | "wrong"

interface ImportRow {
  id: string
  status: ImportRowStatus
  name: string
  sku: string
  price: number | null
  stock: number | null
  image: string | null
  reason: string | null
  raw: Record<string, string> | null
}

type FilterTone = "neutral" | "success" | "warning" | "danger"

interface FilterOption {
  value: TabValue
  label: string
  count: number
  tone: FilterTone
  Icon: LucideIcon
}

const FILTER_TONE_CLASSES: Record<FilterTone, string> = {
  neutral: "border-border-strong bg-surface text-text-secondary",
  success: "border-success/25 bg-success/8 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/8 text-danger",
}

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

// Spreadsheet headers are machine-readable ("Heavy_Shipping_Surcharge"), so they are
// mapped to the wording a vendor sees elsewhere in the dashboard. Keys are matched
// case-insensitively; anything not listed falls back to humanizeColumn().
const COLUMN_LABELS: Record<string, string> = {
  active: "Active",
  brand: "Brand",
  category: "Category",
  export_packaging: "Export Packaging",
  fulfillment_policy: "Fulfillment Policy",
  heavy_shipping_surcharge: "Heavy Shipping Fee",
  image: "Image",
  manufacture: "Manufacturer",
  manufacturer_code: "Manufacturer Code",
  name: "Product Name",
  price: "Price",
  shipment_fee: "Shipping Fee",
  sku: "SKU",
  status: "Row Status",
  stock: "Stock",
  vendor_product_code: "Vendor SKU",
}

// The template is file-driven, so a vendor can ship columns we have never seen.
// Turn "Some_Extra_Column" into "Some Extra Column" rather than printing it raw.
function humanizeColumn(key: string): string {
  const words = key
    .trim()
    .replace(/[_-]+/g, " ")
    // Split camelCase without touching runs of capitals like "SKU".
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return key

  return words.map((word) => (word === word.toUpperCase() ? word : word[0].toUpperCase() + word.slice(1))).join(" ")
}

function columnLabel(key: string): string {
  return COLUMN_LABELS[key.trim().toLowerCase()] ?? humanizeColumn(key)
}

// Mirrors the backend's NUMERIC_COLUMNS — the spreadsheet columns that hold money.
const MONEY_COLUMNS = new Set(["price", "shipment_fee", "heavy_shipping_surcharge"])

// Cells arrive as raw strings ("43.4"), so money columns are rendered as currency.
// A value that is not a number is shown untouched rather than coerced to $0.00.
function columnValue(key: string, value: string): string {
  if (!MONEY_COLUMNS.has(key.trim().toLowerCase())) return value

  const amount = Number(value)
  return Number.isFinite(amount) ? formatCurrency(amount) : value
}

// Column names come from the uploaded spreadsheet, so match them case-insensitively
// and never assume a fixed header set.
function pickCell(row: Record<string, string>, candidates: string[]): string {
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const hit = entries.find(([key]) => key.trim().toLowerCase() === candidate)
    if (hit?.[1]?.trim()) return hit[1].trim()
  }
  return ""
}

// Every spreadsheet cell arrives as a string ("43.4", "50"), so numeric columns are
// parsed here. Anything that is not a plain number is dropped rather than rendered
// as NaN — the raw text stays visible in the expanded row either way.
function pickNumericCell(row: Record<string, string>, candidates: string[]): number | null {
  const raw = pickCell(row, candidates)
  if (!raw) return null

  const direct = Number(raw)
  if (Number.isFinite(direct)) return direct

  // Tolerate currency symbols and spaces ("$43.4", "43.4 USD") but not ambiguous
  // thousands separators, which would silently change the value.
  const stripped = raw.replace(/[^\d.-]/g, "")
  const parsed = Number(stripped)
  return stripped !== "" && Number.isFinite(parsed) ? parsed : null
}

// Backend row-issue lines look like "Row 2: <reason>". The endpoint itself carries no
// per-row reason, so issues are matched back by their row number when one is parseable.
function buildReasonLookup(rowIssues: string[]): Map<number, string> {
  const lookup = new Map<number, string>()
  for (const issue of rowIssues) {
    const match = issue.match(/^row\s+(\d+)\s*:\s*(.*)$/i)
    if (match?.[1] && match[2]?.trim()) {
      lookup.set(Number(match[1]), match[2].trim())
    }
  }
  return lookup
}

function toRows(data: DocumentProductsResponse, rowIssues: string[]): ImportRow[] {
  const reasons = buildReasonLookup(rowIssues)
  const unmatchedReasons = [...reasons.values()]

  const productRows = data.products.map((entry, index) => ({
    id: `product-${index}`,
    status: (entry.status ?? "unknown") as ImportRowStatus,
    name: entry.product?.productName?.trim() || "—",
    sku: entry.product?.skuCode?.trim() || "—",
    price: entry.product?.price ?? null,
    stock: entry.product?.stock ?? null,
    image: entry.product?.coverPhotoPath ? getFullImageUrl(entry.product.coverPhotoPath) : null,
    reason: null,
    raw: null,
  }))

  const wrongRows = data.wrongRows.map((raw, index) => {
    const rowNumber = Number(pickCell(raw, ["row", "row number", "satır"]))
    const reason =
      (Number.isFinite(rowNumber) ? reasons.get(rowNumber) : undefined) ??
      // Fall back to positional pairing only when both lists line up exactly.
      (unmatchedReasons.length === data.wrongRows.length ? unmatchedReasons[index] : undefined) ??
      null

    return {
      id: `wrong-${index}`,
      status: "wrong" as const,
      name: pickCell(raw, ["product_name", "product name", "name", "detailed_name"]) || "—",
      // The backend fills UserProduct.skuCode from Vendor_Product_Code, so failed rows
      // are labelled the same way; Manufacturer_Code is only a fallback.
      sku: pickCell(raw, ["vendor_product_code", "sku_code", "sku", "manufacturer_code"]) || "—",
      price: pickNumericCell(raw, ["price"]),
      stock: pickNumericCell(raw, ["stock"]),
      image: null,
      reason,
      raw,
    }
  })

  return [...productRows, ...wrongRows]
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

function RawRowDetails({ raw }: { raw: Record<string, string> }) {
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

export default function DocumentProductsPanel({
  documentId,
  rowIssues = [],
}: {
  documentId: string
  rowIssues?: string[]
}) {
  const { accessToken } = useAuthStore()
  const [data, setData] = useState<DocumentProductsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>("all")
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const fetchProducts = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await vendorDocumentsAPI.getDocumentProducts(documentId, accessToken)
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load imported products")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, documentId])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  const rows = useMemo(() => (data ? toRows(data, rowIssues) : []), [data, rowIssues])

  const counts = useMemo(
    () => ({
      success: rows.filter((row) => row.status === "success").length,
      skip: rows.filter((row) => row.status === "skip").length,
      wrong: rows.filter((row) => row.status === "wrong").length,
    }),
    [rows],
  )

  // A document with no invalid-records file returns rows without any status,
  // so there is nothing to filter by and the tab group is omitted.
  const hasStatuses = counts.success + counts.skip + counts.wrong > 0

  // The summary pills double as the filter control: each one selects its own rows.
  // Every filter stays on screen even at zero: "0 Skipped" is itself the answer to
  // "was anything skipped?", and a group whose buttons come and go is hard to read.
  const filters = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: "All", count: rows.length, tone: "neutral", Icon: Layers },
      { value: "success", label: "Imported", count: counts.success, tone: "success", Icon: CircleCheck },
      { value: "skip", label: "Skipped", count: counts.skip, tone: "warning", Icon: CircleAlert },
      { value: "wrong", label: "Failed", count: counts.wrong, tone: "danger", Icon: CircleX },
    ],
    [rows.length, counts],
  )

  // Land on the tab that needs attention, and never leave a tab that no longer exists selected.
  useEffect(() => {
    if (!hasStatuses) {
      setActiveTab("all")
      return
    }
    setActiveTab(counts.wrong > 0 ? "wrong" : "all")
  }, [hasStatuses, counts.wrong])

  const filteredRows = useMemo(
    () => (activeTab === "all" ? rows : rows.filter((row) => row.status === activeTab)),
    [rows, activeTab],
  )

  const showReasonColumn = rows.some((row) => row.reason)

  const columns = useMemo<Array<ColumnDef<ImportRow, unknown>>>(() => {
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

  const handleRowClick = useCallback((row: Row<ImportRow>) => {
    if (!row.original.raw) return
    setExpanded((prev) => {
      const current = typeof prev === "object" ? prev : {}
      const next = { ...current }
      if (next[row.id]) {
        delete next[row.id]
      } else {
        next[row.id] = true
      }
      return next
    })
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/8 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">Couldn't load imported products</p>
          <p className="text-xs text-danger">{error}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void fetchProducts()}>
          Try again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border-soft bg-surface py-10">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {hasStatuses && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${filters.length}, minmax(0, 1fr))` }}>
          {filters.map(({ value, label, count, tone, Icon }) => {
            const isActive = activeTab === value
            // An empty group has nothing to show, so it reports its count without
            // being selectable.
            const isEmpty = count === 0
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                disabled={isEmpty}
                onClick={() => setActiveTab(value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-4 py-3 transition-all",
                  FILTER_TONE_CLASSES[tone],
                  isEmpty && "cursor-not-allowed opacity-40",
                  !isEmpty &&
                    (isActive
                      ? "ring-2 ring-current ring-offset-1 ring-offset-surface"
                      : "opacity-55 hover:opacity-100"),
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xl font-semibold">{count}</span>
                <span className="text-xs font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Sized against the viewport rather than a fixed height: the modal itself is
          capped at 90vh, so a fixed 22rem left most of that space unused on a laptop. */}
      <div className="max-h-[48vh] min-h-[12rem] overflow-y-auto rounded-xl border border-border-soft">
        <DataTable
          columns={columns}
          data={filteredRows}
          expanded={expanded}
          onExpandedChange={setExpanded}
          getRowId={(row) => row.id}
          onRowClick={handleRowClick}
          getRowClassName={(row) => (row.original.raw ? "cursor-pointer" : "cursor-default")}
          noRowsText="No rows in this group."
          renderExpandedContent={(row) => (row.original.raw ? <RawRowDetails raw={row.original.raw} /> : null)}
        />
      </div>
    </div>
  )
}
