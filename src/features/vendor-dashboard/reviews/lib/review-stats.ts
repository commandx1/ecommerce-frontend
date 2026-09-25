import type { VendorReviewItem } from "@/lib/api/vendor-reviews"

/** Star buckets shown on the rating breakdown panel, highest first. */
export const STAR_STEPS = [5, 4, 3, 2, 1] as const

export interface RatingBreakdownEntry {
  stars: number
  count: number
  percentage: number
}

/** One entry per `STAR_STEPS` bucket; a missing key or a zero total both read as 0, never NaN. */
export function computeRatingBreakdown(
  starBreakdown: Record<string, number> | undefined,
  totalReviews: number,
): RatingBreakdownEntry[] {
  return STAR_STEPS.map((stars) => {
    const count = starBreakdown?.[String(stars)] ?? 0
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { stars, count, percentage }
  })
}

/** `null` (the "Show all" state) returns every review; otherwise only the matching star count. */
export function filterReviewsByStar(reviews: VendorReviewItem[], selectedStar: number | null): VendorReviewItem[] {
  return selectedStar === null ? reviews : reviews.filter((review) => review.star === selectedStar)
}

/** A malformed 200 (non-array `reviews`) must not white-screen the page; `?? []` only guards null/undefined. */
export function normalizeReviews(reviews: unknown): VendorReviewItem[] {
  return Array.isArray(reviews) ? (reviews as VendorReviewItem[]) : []
}
