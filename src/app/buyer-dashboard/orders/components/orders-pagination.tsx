"use client"

import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import { useBuyerOrdersPaginationActions, useBuyerOrdersPaginationSelector } from "../context/buyer-orders-context"

export default function OrdersPagination() {
  const { currentPage, pageSize, totalElements, totalPages } = useBuyerOrdersPaginationSelector((state) => ({
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalElements: state.totalElements,
    totalPages: state.totalPages,
  }))
  const { handlePageChange } = useBuyerOrdersPaginationActions()

  return (
    <DashboardPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalElements={totalElements}
      pageSize={pageSize}
      onPageChange={handlePageChange}
    />
  )
}
