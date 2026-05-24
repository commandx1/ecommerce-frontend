"use client"

import {
  type ColumnDef,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  type OnChangeFn,
  type Row,
  useReactTable,
} from "@tanstack/react-table"
import { AnimatePresence, motion } from "motion/react"
import { Fragment, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface DataTableColumnMeta {
  cellClassName?: string
  headerClassName?: string
}

interface DataTableProps<TData> {
  columns: Array<ColumnDef<TData, unknown>>
  data: TData[]
  expanded?: ExpandedState
  getRowClassName?: (row: Row<TData>) => string
  getRowId?: (originalRow: TData, index: number) => string
  isLoading?: boolean
  loadingText?: string
  minTableWidthClassName?: string
  noRowsText?: string
  onExpandedChange?: OnChangeFn<ExpandedState>
  renderExpandedContent?: (row: Row<TData>) => ReactNode
  tableClassName?: string
}

export default function DataTable<TData>({
  columns,
  data,
  expanded,
  getRowClassName,
  getRowId,
  isLoading = false,
  loadingText = "Loading...",
  minTableWidthClassName = "",
  noRowsText = "No rows found.",
  onExpandedChange,
  renderExpandedContent,
  tableClassName,
}: DataTableProps<TData>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => Boolean(renderExpandedContent),
    getRowId,
    onExpandedChange,
    state: expanded !== undefined ? { expanded } : undefined,
  })

  const visibleColumnCount = table.getVisibleLeafColumns().length

  return (
    <table className={cn("w-full border-collapse text-left", minTableWidthClassName, tableClassName)}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr
            key={headerGroup.id}
            className="border-b border-border-soft bg-surface-elevated text-xs font-semibold tracking-wider text-text-muted uppercase"
          >
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined
              return (
                <th key={header.id} colSpan={header.colSpan} className={cn("px-6 py-4", meta?.headerClassName)}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody className="text-sm text-text-secondary">
        {isLoading ? (
          <tr>
            <td colSpan={visibleColumnCount} className="px-6 py-12 text-center text-text-muted">
              {loadingText}
            </td>
          </tr>
        ) : table.getRowModel().rows.length === 0 ? (
          <tr>
            <td colSpan={visibleColumnCount} className="px-6 py-12 text-center text-text-muted">
              {noRowsText}
            </td>
          </tr>
        ) : (
          table.getRowModel().rows.map((row) => {
            return (
              <Fragment key={row.id}>
                <tr key={row.id} className={cn("border-b border-border-soft", getRowClassName?.(row))}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                    return (
                      <td key={cell.id} className={cn("px-6 py-4", meta?.cellClassName)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
                <AnimatePresence initial={false}>
                  {row.getIsExpanded() && renderExpandedContent ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="border-b border-border-soft p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0, y: -8 }}
                          animate={{ height: "auto", opacity: 1, y: 0 }}
                          exit={{ height: 0, opacity: 0, y: -8 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          {renderExpandedContent(row)}
                        </motion.div>
                      </td>
                    </tr>
                  ) : null}
                </AnimatePresence>
              </Fragment>
            )
          })
        )}
      </tbody>
    </table>
  )
}
