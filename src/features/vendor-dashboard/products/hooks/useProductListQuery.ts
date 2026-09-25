"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { isAuthHandledError } from "@/lib/api/auth-error"
import type { UserProductSortBy } from "@/lib/api/products"
import { useDebounce } from "@/lib/hooks/useDebounce"
import type { VendorProductListParams } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"
import { vendorProductsListOptions } from "../api/products-queries"
import type { FilterType } from "../components/ProductStatsCards"
import type { PeriodTab, ProductWithDetails, ReviewApprovedFilter, ViewMode } from "../types"

export const PERIOD_TAB_TO_DAY_COUNT: Record<PeriodTab, number> = {
  "3 months": 90,
  "6 months": 180,
  "12 months": 365,
}

export const BRAND_FILTER_ALL = "ALL_BRANDS"

const VALID_FILTER_TYPES: FilterType[] = ["ALL", "TOTAL", "ACTIVE", "INACTIVE", "OUT_OF_STOCK", "LOW_STOCK"]

export interface ProductListQueryResult {
  viewMode: ViewMode
  handleViewModeChange: (mode: ViewMode) => void
  selectedFilter: FilterType
  handleFilterChange: (filter: FilterType) => void
  selectedUserProductId: string | null
  selectedPeriodTab: PeriodTab
  handlePeriodTabChange: (period: PeriodTab) => void
  reviewApprovedFilter: ReviewApprovedFilter
  handleReviewApprovedFilterChange: (filter: ReviewApprovedFilter) => void
  selectedBrand: string
  handleBrandChange: (brand: string) => void
  searchQuery: string
  handleSearchChange: (query: string) => void
  sortField: UserProductSortBy | null
  sortDirection: "asc" | "desc"
  handleSort: (field: UserProductSortBy) => void
  pageSize: number
  handlePageSizeChange: (size: number) => void
  currentPage: number
  handlePageChange: (page: number) => void
  totalPages: number
  totalElements: number
  rows: ProductWithDetails[]
  isLoading: boolean
  isFetching: boolean
  fetchError: boolean
  refetch: () => void
  listParams: VendorProductListParams
}

/**
 * Owns every filter/sort/page/view piece of state the list request depends on, builds the
 * `VendorProductListParams` key (design §3.1) and runs the query. Failure semantics (design
 * §3.2): a non-auth-handled error renders an empty table with `fetchError` (the page shows the
 * "Failed to load" banner); an auth-handled 401/403 leaves the vendor on the page mid-redirect
 * with no banner, matching the axios interceptor's own logout.
 */
export function useProductListQuery(): ProductListQueryResult {
  const searchParams = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)

  const [viewMode, setViewMode] = useState<ViewMode>("products")
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(() => {
    const filterParam = searchParams.get("filter")
    return VALID_FILTER_TYPES.includes(filterParam as FilterType) ? (filterParam as FilterType) : "TOTAL"
  })
  const selectedUserProductId = searchParams.get("userProductId")
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<PeriodTab>("3 months")
  const [reviewApprovedFilter, setReviewApprovedFilter] = useState<ReviewApprovedFilter>("ALL")
  const [selectedBrand, setSelectedBrand] = useState<string>(BRAND_FILTER_ALL)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [sortField, setSortField] = useState<UserProductSortBy | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(0)

  const listParams: VendorProductListParams =
    viewMode === "review"
      ? {
          view: "review",
          approved: reviewApprovedFilter,
          sortBy: "createdDate",
          sortDir: "desc",
          page: currentPage,
          size: pageSize,
        }
      : {
          view: "active",
          type: selectedFilter === "ALL" ? "TOTAL" : selectedFilter,
          page: currentPage,
          size: pageSize,
          sortBy: sortField ?? "STOCK",
          sortDir: sortField ? sortDirection : "asc",
          search: debouncedSearchQuery,
          howManySoldDay: PERIOD_TAB_TO_DAY_COUNT[selectedPeriodTab],
          userProductId: selectedUserProductId,
          brand: selectedBrand === BRAND_FILTER_ALL ? null : selectedBrand,
        }

  const enabled = Boolean(isAuthenticated && accessToken)
  const listQuery = useQuery(vendorProductsListOptions(listParams, enabled, accessToken))

  // Stabilized with `useCallback` (every one of these closes only over `set*` state setters,
  // which React itself guarantees are stable) so a table column built from them can be
  // `useMemo`-d in `components/columns.tsx` — without that, react-table's `flexRender` treats
  // each header as a brand-new component on every unrelated re-render, remounting the header
  // `<button>` mid-click and silently dropping the interaction (see that file for detail).
  const handleFilterChange = useCallback((filter: FilterType) => {
    setSelectedFilter(filter)
    setCurrentPage(0)
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0)
  }, [])

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(0)
  }, [])

  const handleBrandChange = useCallback((brand: string) => {
    setSelectedBrand(brand)
    setCurrentPage(0)
  }, [])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    setCurrentPage(0)
  }, [])

  const handleReviewApprovedFilterChange = useCallback((filter: ReviewApprovedFilter) => {
    setReviewApprovedFilter(filter)
    setCurrentPage(0)
  }, [])

  const handlePeriodTabChange = useCallback((period: PeriodTab) => setSelectedPeriodTab(period), [])

  const handleSort = useCallback(
    (field: UserProductSortBy) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
    },
    [sortField],
  )

  const fetchError = listQuery.isError && !isAuthHandledError(listQuery.error)
  const { refetch } = listQuery
  const handleRefetch = useCallback(() => void refetch(), [refetch])

  return {
    viewMode,
    handleViewModeChange,
    selectedFilter,
    handleFilterChange,
    selectedUserProductId,
    selectedPeriodTab,
    handlePeriodTabChange,
    reviewApprovedFilter,
    handleReviewApprovedFilterChange,
    selectedBrand,
    handleBrandChange,
    searchQuery,
    handleSearchChange,
    sortField,
    sortDirection,
    handleSort,
    pageSize,
    handlePageSizeChange,
    currentPage,
    handlePageChange,
    totalPages: listQuery.data?.totalPages ?? 0,
    totalElements: listQuery.data?.totalElements ?? 0,
    rows: listQuery.data?.rows ?? [],
    // Mutually exclusive with `isFetching`, same as the page's old isLoading/isFetching split:
    // only the very first fetch (nothing cached yet) shows the full skeleton text.
    isLoading: listQuery.isPending && enabled,
    isFetching: listQuery.isFetching && !listQuery.isPending,
    fetchError,
    refetch: handleRefetch,
    listParams,
  }
}
