"use client"

import type { Row } from "@tanstack/react-table"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentProductsPanel } from "../hooks/useDocumentProductsPanel"
import type { ImportRow } from "../lib/document-products-rows"
import DocumentProductsFilterPills from "./DocumentProductsFilterPills"
import { RawRowDetails, useDocumentProductsColumns } from "./document-products-columns"

export default function DocumentProductsPanel({
  documentId,
  rowIssues = [],
}: {
  documentId: string
  rowIssues?: string[]
}) {
  const panel = useDocumentProductsPanel(documentId, rowIssues)
  const columns = useDocumentProductsColumns(panel.showReasonColumn)

  const handleRowClick = useCallback(
    (row: Row<ImportRow>) => {
      if (!row.original.raw) return
      panel.setExpanded((prev) => {
        const current = typeof prev === "object" ? prev : {}
        const next = { ...current }
        if (next[row.id]) {
          delete next[row.id]
        } else {
          next[row.id] = true
        }
        return next
      })
    },
    [panel.setExpanded],
  )

  if (panel.errorMessage) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/8 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">Couldn't load imported products</p>
          <p className="text-xs text-danger">{panel.errorMessage}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={panel.refetch}>
          Try again
        </Button>
      </div>
    )
  }

  if (panel.isLoading) {
    // Not DataTable's own `isLoading` skeleton: this panel is a scrollable list, not a table.
    // (It also used to be a correctness issue — DataTable announced loading through a real body
    // <tr>, which this file's getAllByRole("row") waits counted as data. That row is a <caption>
    // now, so the hazard is gone; the list shape is the only reason left.)
    return (
      <div
        aria-busy="true"
        className="max-h-[48vh] min-h-[12rem] space-y-2 overflow-y-auto rounded-xl border border-border-soft p-3"
      >
        <span className="sr-only">Loading imported products...</span>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {panel.hasStatuses && (
        <DocumentProductsFilterPills
          activeTab={panel.activeTab}
          onTabChange={panel.setActiveTab}
          totalCount={panel.totalCount}
          counts={panel.counts}
        />
      )}

      {/* Sized against the viewport rather than a fixed height: the modal itself is
          capped at 90vh, so a fixed 22rem left most of that space unused on a laptop. */}
      <div className="max-h-[48vh] min-h-[12rem] overflow-y-auto rounded-xl border border-border-soft">
        <DataTable
          columns={columns}
          data={panel.filteredRows}
          expanded={panel.expanded}
          onExpandedChange={panel.setExpanded}
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
