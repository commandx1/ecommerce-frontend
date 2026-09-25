"use client"

import { useQuery } from "@tanstack/react-query"
import type { ExpandedState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { queryKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"
import { type ImportRow, toRows } from "../lib/document-products-rows"

export type DocumentProductsTab = "all" | "success" | "skip" | "wrong"

export interface DocumentProductsPanelViewModel {
  activeTab: DocumentProductsTab
  setActiveTab: (tab: DocumentProductsTab) => void
  expanded: ExpandedState
  setExpanded: (updater: ExpandedState | ((prev: ExpandedState) => ExpandedState)) => void
  isLoading: boolean
  errorMessage: string | null
  refetch: () => void
  hasStatuses: boolean
  counts: { success: number; skip: number; wrong: number }
  totalCount: number
  filteredRows: ImportRow[]
  showReasonColumn: boolean
}

/**
 * An import result is derived from a file that never changes, so re-opening the same document
 * should not hit the network again — the window is finite rather than infinite because the rows
 * carry live `UserProduct` fields (price, stock) that the vendor can edit elsewhere.
 */
export function useDocumentProductsPanel(documentId: string, rowIssues: string[] = []): DocumentProductsPanelViewModel {
  const { accessToken } = useAuthStore()
  const [activeTab, setActiveTab] = useState<DocumentProductsTab>("all")
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.vendor.documents.products(documentId),
    queryFn: () => vendorDocumentsAPI.getDocumentProducts(documentId, accessToken as string),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })

  const isLoading = isPending && Boolean(accessToken)
  const errorMessage = error instanceof Error ? error.message : error ? "Failed to load imported products" : null

  const rows = useMemo(() => (data ? toRows(data, rowIssues) : []), [data, rowIssues])

  const counts = useMemo(
    () => ({
      success: rows.filter((row) => row.status === "success").length,
      skip: rows.filter((row) => row.status === "skip").length,
      wrong: rows.filter((row) => row.status === "wrong").length,
    }),
    [rows],
  )

  // A document with no invalid-records file returns rows without any status, so there is
  // nothing to filter by.
  const hasStatuses = counts.success + counts.skip + counts.wrong > 0

  // Land on the tab that needs attention, and never leave a tab that no longer exists selected.
  useEffect(() => {
    if (!hasStatuses) {
      setActiveTab("all")
      return
    }
    // Open on what was imported; fall back to "All" when nothing landed, so the selected pill
    // is never an empty (and therefore disabled) group.
    setActiveTab(counts.success > 0 ? "success" : "all")
  }, [hasStatuses, counts.success])

  const filteredRows = useMemo(
    () => (activeTab === "all" ? rows : rows.filter((row) => row.status === activeTab)),
    [rows, activeTab],
  )

  const showReasonColumn = rows.some((row) => row.reason)

  return {
    activeTab,
    setActiveTab,
    expanded,
    setExpanded,
    isLoading,
    errorMessage,
    refetch: () => void refetch(),
    hasStatuses,
    counts,
    totalCount: rows.length,
    filteredRows,
    showReasonColumn,
  }
}
