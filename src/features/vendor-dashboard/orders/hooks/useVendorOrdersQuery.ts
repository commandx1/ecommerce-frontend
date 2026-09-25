"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { parseOrderIdParam } from "@/lib/api/orders"
import type { VendorOrder, VendorOrderFilterType } from "@/lib/api/vendor-orders"
import type { VendorOrderListParams } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"
import { vendorOrdersListOptions } from "../api/orders-queries"

export const VENDOR_ORDER_TABS = ["All", "Pending", "Shipped", "Delivered", "Cancelled", "Returned"] as const
export type VendorOrderStatusTab = (typeof VENDOR_ORDER_TABS)[number]

const TAB_TO_FILTER: Record<VendorOrderStatusTab, VendorOrderFilterType> = {
  All: "ALL",
  Pending: "WAITING_FOR_SHIPMENT",
  Shipped: "ON_WAY",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
  Returned: "RETURNED",
}

export type VendorOrderSortField = "price" | "quantity" | "createdDate"

export interface VendorOrdersQueryResult {
  selectedTab: VendorOrderStatusTab
  handleTabChange: (tab: VendorOrderStatusTab) => void
  singleOrderId: string | null
  clearSingleOrder: () => void
  orders: VendorOrder[]
  isLoading: boolean
  pageSize: number
  handlePageSizeChange: (size: number) => void
  currentPage: number
  effectivePage: number
  handlePageChange: (page: number) => void
  totalPages: number
  totalElements: number
  sortBy: VendorOrderSortField
  sortDir: "asc" | "desc"
  handleSortToggle: (field: VendorOrderSortField) => void
  listParams: VendorOrderListParams
}

/**
 * URL params (tab, single-order deep link) plus local page/size/sort state build the query key,
 * exactly the same fields the old page's fetch effect depended on (design §S8). See
 * `orders-queries.ts` for the `keepPreviousData` behaviour this brings on a param change.
 */
export function useVendorOrdersQuery(): VendorOrdersQueryResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)

  const selectedTab = useMemo<VendorOrderStatusTab>(() => {
    const value = searchParams.get("selectedTab")
    return (VENDOR_ORDER_TABS as readonly string[]).includes(value ?? "") ? (value as VendorOrderStatusTab) : "All"
  }, [searchParams])
  // See buyer orders page: the backend ignores type/page/sort while orderId is set and
  // returns only that one order.
  const singleOrderId = useMemo(() => parseOrderIdParam(searchParams.get("orderId")), [searchParams])

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)
  // Derived, not reset in an effect: a second state update would abort and re-send the request.
  const effectivePage = singleOrderId ? 0 : currentPage
  const [sortBy, setSortBy] = useState<VendorOrderSortField>("createdDate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const listParams: VendorOrderListParams = {
    page: effectivePage,
    size: pageSize,
    sortBy,
    sortDir,
    type: TAB_TO_FILTER[selectedTab],
    orderId: singleOrderId,
  }

  const enabled = Boolean(isAuthenticated && accessToken)
  const listQuery = useQuery(vendorOrdersListOptions(listParams, enabled))

  const handleTabChange = useCallback(
    (tab: VendorOrderStatusTab) => {
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

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }, [])

  const handleSortToggle = useCallback(
    (field: VendorOrderSortField) => {
      if (sortBy === field) {
        setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
      } else {
        setSortBy(field)
        setSortDir("desc")
      }
      setCurrentPage(0)
    },
    [sortBy],
  )

  return {
    selectedTab,
    handleTabChange,
    singleOrderId,
    clearSingleOrder,
    orders: listQuery.data?.orders ?? [],
    isLoading: listQuery.isPending && enabled,
    pageSize,
    handlePageSizeChange,
    currentPage,
    effectivePage,
    handlePageChange,
    totalPages: listQuery.data?.totalPages ?? 0,
    totalElements: listQuery.data?.totalElements ?? 0,
    sortBy,
    sortDir,
    handleSortToggle,
    listParams,
  }
}
