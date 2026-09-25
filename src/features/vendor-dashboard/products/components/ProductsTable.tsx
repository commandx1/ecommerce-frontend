"use client"

import type { ColumnDef, Row } from "@tanstack/react-table"
import type { MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import type { ProductWithDetails } from "../types"

interface ProductsTableProps {
  columns: Array<ColumnDef<ProductWithDetails, unknown>>
  rows: ProductWithDetails[]
  isLoading: boolean
  isFetching: boolean
  fetchError: boolean
  onRetry: () => void
  selectedProductIds: string[]
  editingProductId: string | null
  onRowClick: (row: Row<ProductWithDetails>, event: MouseEvent<HTMLTableRowElement>) => void
}

/** The list body: the failed-to-load banner, or the table with the same fetching-overlay
 * treatment the page applied inline before this was extracted. */
export default function ProductsTable({
  columns,
  rows,
  isLoading,
  isFetching,
  fetchError,
  onRetry,
  selectedProductIds,
  editingProductId,
  onRowClick,
}: ProductsTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto transition-opacity duration-150",
        isFetching && "opacity-50",
        isFetching && !editingProductId && "pointer-events-none",
      )}
    >
      {fetchError && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <p className="text-sm font-medium text-danger">Failed to load products. Please try again.</p>
          <Button type="button" variant="outline" onClick={onRetry} className="rounded-lg px-4">
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          getRowClassName={(row) =>
            cn(
              "border-l-4 border-l-transparent transition-colors hover:bg-surface-muted/80",
              selectedProductIds.includes(row.original.id) && "border-l-brand bg-brand/8 hover:bg-brand/12",
              editingProductId === row.original.id && "cursor-default hover:bg-transparent",
            )
          }
          getRowId={(product) => product.id}
          onRowClick={onRowClick}
          isLoading={isLoading}
          loadingText="Loading products..."
          minTableWidthClassName="min-w-[1700px]"
          noRowsText="No products found. Create your first product!"
        />
      )}
    </div>
  )
}
