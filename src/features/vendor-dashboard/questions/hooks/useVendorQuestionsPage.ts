"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { ProductQuestionResponse, QuestionFilter, SellerQuestionCounts } from "@/lib/api/vendor-questions"
import { useAuthStore } from "@/stores/authStore"
import { vendorQuestionsCountsOptions, vendorQuestionsListOptions } from "../api/questions-queries"

export const QUESTIONS_PAGE_SIZE = 10

export interface VendorQuestionsViewModel {
  isAuthenticated: boolean
  currentUserId: string | null
  questions: ProductQuestionResponse[]
  counts: SellerQuestionCounts | null
  isLoading: boolean
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  totalElements: number
  activeFilter: QuestionFilter
  handleFilterChange: (filter: QuestionFilter) => void
}

/**
 * A failed list load shows "Failed to load questions" (one toast per distinct failure, keyed off
 * `errorUpdatedAt`) and renders empty rows. A failed counts load stays silent (`counts` stays `null`).
 */
export function useVendorQuestionsPage(): VendorQuestionsViewModel {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const currentUserId = useAuthStore((state) => state.user?.id ?? null)

  const [currentPage, setCurrentPage] = useState(0)
  const [activeFilter, setActiveFilter] = useState<QuestionFilter>("all")

  const enabled = Boolean(isAuthenticated && accessToken)
  const listParams = { page: currentPage, size: QUESTIONS_PAGE_SIZE, filter: activeFilter }

  const listQuery = useQuery(vendorQuestionsListOptions(listParams, enabled))
  const countsQuery = useQuery(vendorQuestionsCountsOptions(enabled))

  // biome-ignore lint/correctness/useExhaustiveDependencies: errorUpdatedAt is what makes this fire once per distinct failure, not once per re-render while isError stays true
  useEffect(() => {
    if (listQuery.isError) {
      showToast.error("Failed to load questions", "Please refresh the page.")
    }
  }, [listQuery.isError, listQuery.errorUpdatedAt])

  const handleFilterChange = (filter: QuestionFilter) => {
    setActiveFilter(filter)
    setCurrentPage(0)
  }

  return {
    isAuthenticated,
    currentUserId,
    questions: listQuery.data?.content ?? [],
    counts: countsQuery.data ?? null,
    isLoading: listQuery.isPending && enabled,
    currentPage,
    setCurrentPage,
    totalPages: listQuery.data?.totalPages ?? 0,
    totalElements: listQuery.data?.totalElements ?? 0,
    activeFilter,
    handleFilterChange,
  }
}
