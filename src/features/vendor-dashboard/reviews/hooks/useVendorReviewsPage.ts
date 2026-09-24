"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import type { VendorReviewItem } from "@/lib/api/vendor-reviews"
import { useAuthStore } from "@/stores/authStore"
import { vendorReviewsDashboardOptions } from "../api/reviews-queries"
import {
  computeRatingBreakdown,
  filterReviewsByStar,
  normalizeReviews,
  type RatingBreakdownEntry,
} from "../lib/review-stats"

export interface VendorReviewsViewModel {
  loading: boolean
  error: boolean
  selectedStars: number | null
  setSelectedStars: (stars: number | null) => void
  reviews: VendorReviewItem[]
  totalReviews: number
  averageRating: number
  positiveReviews: number
  positiveRatio: number
  reviewedProductsCount: number
  ratingBreakdown: RatingBreakdownEntry[]
}

export function useVendorReviewsPage(): VendorReviewsViewModel {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [selectedStars, setSelectedStars] = useState<number | null>(null)

  const { data, isPending } = useQuery(vendorReviewsDashboardOptions(accessToken ?? undefined))

  const loading = isPending && Boolean(accessToken)
  // `data` is `undefined` while the query is disabled (no token) or still pending, and `null`
  // only once `getVendorReviewDashboard` itself resolved to "failed" - see reviews-queries.ts.
  const error = data === null

  const allReviews = normalizeReviews(data?.reviews)
  const totalReviews = data?.totalReviews ?? 0

  return {
    loading,
    error,
    selectedStars,
    setSelectedStars,
    reviews: filterReviewsByStar(allReviews, selectedStars),
    totalReviews,
    averageRating: data?.averageRating ?? 0,
    positiveReviews: data?.positiveReviews ?? 0,
    positiveRatio: data?.positiveRatio ?? 0,
    reviewedProductsCount: data?.reviewedProducts ?? 0,
    ratingBreakdown: computeRatingBreakdown(data?.starBreakdown, totalReviews),
  }
}
