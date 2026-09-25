"use client"

import type { CellContext, ColumnDef } from "@tanstack/react-table"
import { useCallback } from "react"
import type { UserProductSortBy } from "@/lib/api/products"
import { formatNumber } from "@/lib/helpers/format"
import formatCurrency from "@/lib/helpers/formatCurrency"
import type { ProductWithDetails, ViewMode } from "../../types"
import { SortHeader } from "./shared"

// Pure formatting cells (only read `row.original`): no props, so hoisted to module scope instead
// of being recreated (and, per the note on `useProductColumns` in `index.tsx`, remounted) on
// every render.
const renderPeriodicSellCountCell = ({ row }: CellContext<ProductWithDetails, unknown>) => (
  <span className="text-sm text-text-secondary">
    {row.original.periodicSellCount != null ? formatNumber(row.original.periodicSellCount) : 0}
  </span>
)

const renderPeriodicGrossRevenueCell = ({ row }: CellContext<ProductWithDetails, unknown>) => (
  <span className="text-sm font-medium text-text-primary">
    {formatCurrency(row.original.periodicGrossRevenue ?? 0)}
  </span>
)

export interface UseMetricsColumnsParams {
  viewMode: ViewMode
  sortField: UserProductSortBy | null
  sortDirection: "asc" | "desc"
  onSort: (field: UserProductSortBy) => void
}

export function useMetricsColumns({
  viewMode,
  sortField,
  sortDirection,
  onSort,
}: UseMetricsColumnsParams): Array<ColumnDef<ProductWithDetails, unknown>> {
  const renderPeriodicSellCountHeader = useCallback(
    () => (
      <SortHeader
        label="Qty Sold"
        field="PERIODIC_SELL_COUNT"
        sortField={sortField}
        sortDirection={sortDirection}
        disabled={viewMode === "review"}
        onSort={onSort}
      />
    ),
    [sortField, sortDirection, viewMode, onSort],
  )

  const renderPeriodicGrossRevenueHeader = useCallback(
    () => (
      <SortHeader
        label="Sales"
        field="PERIODIC_GROSS_REVENUE"
        sortField={sortField}
        sortDirection={sortDirection}
        disabled={viewMode === "review"}
        onSort={onSort}
      />
    ),
    [sortField, sortDirection, viewMode, onSort],
  )

  return [
    {
      id: "periodicSellCount",
      header: renderPeriodicSellCountHeader,
      cell: renderPeriodicSellCountCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "periodicGrossRevenue",
      header: renderPeriodicGrossRevenueHeader,
      cell: renderPeriodicGrossRevenueCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
  ]
}
