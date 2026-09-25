"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { BuyerOrder, BuyerOrderFilterType } from "@/lib/api/buyer-orders"
import { parseOrderIdParam } from "@/lib/api/orders"
import type { BuyerOrderListParams } from "@/lib/query/keys"
import { useQueryErrorToast } from "@/lib/query/useQueryErrorToast"
import { useAuthStore } from "@/stores/authStore"
import { buyerOrdersListOptions } from "../api/orders-queries"
import type { BuyerOrderStatusTab } from "../types"

const DEFAULT_PAGE_SIZE = 10
const ORDER_STATUS_TABS = ["All", "Pending", "Shipped", "Delivered", "Cancelled", "Returned"] as const
const ORDER_STATUS_TAB_TO_FILTER_TYPE: Record<BuyerOrderStatusTab, BuyerOrderFilterType> = {
  All: "ALL",
  Pending: "WAITING_FOR_SHIPMENT",
  Shipped: "ON_WAY",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
  Returned: "RETURNED",
}

function isBuyerOrderStatusTab(value: string | null): value is BuyerOrderStatusTab {
  return Boolean(value && ORDER_STATUS_TABS.includes(value as BuyerOrderStatusTab))
}

export interface UseBuyerOrdersQueryResult {
  orders: BuyerOrder[]
  isLoading: boolean
  totalPages: number
  totalElements: number
  currentPage: number
  pageSize: number
  sortField: "createdDate" | "totalPrice"
  sortDir: "asc" | "desc"
  selectedTab: BuyerOrderStatusTab
  singleOrderId: string | null
  isAuthenticated: boolean
  /** The list params behind the query currently on screen - handed to `useBuyerOrderActions` so
   * a cancel/refund write knows which cache entry to patch (§2.3). */
  params: BuyerOrderListParams
  handleTabChange: (tab: BuyerOrderStatusTab) => void
  handlePageChange: (page: number) => void
  handleSort: (field: "createdDate" | "totalPrice") => void
  clearSingleOrder: () => void
}

/**
 * Owns the URL/tab/page/sort -> params derivation and the list query (Phase 4 §7, B4c). Split
 * out of the old `use-buyer-orders-page.ts` so the composing hook doesn't also have to know
 * about `useSearchParams`/pagination state to read `filteredOrders`/`isLoading`.
 */
export function useBuyerOrdersQuery(): UseBuyerOrdersQueryResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()

  const [currentPage, setCurrentPage] = useState(0)
  const [sort, setSort] = useState<{ field: "createdDate" | "totalPrice"; dir: "asc" | "desc" }>({
    field: "createdDate",
    dir: "desc",
  })

  const pageSize = DEFAULT_PAGE_SIZE

  const selectedTab = useMemo<BuyerOrderStatusTab>(() => {
    const queryValue = searchParams.get("selectedTab")
    if (isBuyerOrderStatusTab(queryValue)) {
      return queryValue
    }
    return "All"
  }, [searchParams])

  // Coming from a notification: the backend ignores type/page/sort while this is set and
  // returns only this one order (ownership-checked), so the tab bar and pagination are
  // irrelevant until the shopper clears it.
  const singleOrderId = useMemo(() => parseOrderIdParam(searchParams.get("orderId")), [searchParams])
  // Derived, not reset in an effect: a second state update would abort and re-send the request.
  const effectivePage = singleOrderId ? 0 : currentPage

  const params = useMemo<BuyerOrderListParams>(
    () => ({
      page: effectivePage,
      size: pageSize,
      sortBy: sort.field,
      sortDir: sort.dir,
      type: ORDER_STATUS_TAB_TO_FILTER_TYPE[selectedTab],
      orderId: singleOrderId,
    }),
    [effectivePage, pageSize, sort, selectedTab, singleOrderId],
  )

  const ordersQuery = useQuery(buyerOrdersListOptions(params, isAuthenticated))
  useQueryErrorToast(ordersQuery, () =>
    showToast.error("Orders unavailable", "Your orders could not be loaded right now. Please try again."),
  )

  const handleTabChange = useCallback(
    (tab: BuyerOrderStatusTab) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("selectedTab", tab)
      nextParams.delete("orderId")
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
      setCurrentPage(0)
    },
    [pathname, router, searchParams],
  )

  const clearSingleOrder = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("orderId")
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleSort = useCallback((field: "createdDate" | "totalPrice") => {
    setSort((prev) => ({
      field,
      dir: prev.field === field ? (prev.dir === "desc" ? "asc" : "desc") : "desc",
    }))
    setCurrentPage(0)
  }, [])

  return {
    orders: ordersQuery.data?.orders ?? [],
    isLoading: ordersQuery.isPending,
    totalPages: ordersQuery.data?.totalPages ?? 0,
    totalElements: ordersQuery.data?.totalElements ?? 0,
    currentPage: effectivePage,
    pageSize,
    sortField: sort.field,
    sortDir: sort.dir,
    selectedTab,
    singleOrderId,
    isAuthenticated,
    params,
    handleTabChange,
    handlePageChange,
    handleSort,
    clearSingleOrder,
  }
}
