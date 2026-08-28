import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * `VendorReviewDashboard`/`VendorReviewItem` (src/lib/api/vendor-reviews.ts)
 * have no exported builder in src/test/factories/**, so this file defines its
 * own. Field names/types verified against the backend DTOs (source of truth):
 * ecommerce-api/.../product/dto/{VendorReviewDashboard,VendorReviewItem}.java
 * and product/controller/CustomerReviewController.java's `GET /api/reviews/vendor`.
 * NOTE this endpoint is fetched through the Next.js BFF route
 * `src/app/api/reviews/vendor/route.ts` (plain `/api/reviews/vendor`), NOT
 * through `/backend-api/**` like the questions/answers endpoints.
 * `starBreakdown` is a Java `Map<Integer, Long>` - Jackson serializes map keys
 * as strings (`{"5": 3, ...}`), matching the frontend's `String(stars)` lookup.
 */

export interface MockVendorReviewItem {
  id: string
  productId: string
  productName: string
  star: number
  title: string
  comment: string
  reviewerName: string
  reviewerClinic: string | null
  createdDate: string
  peopleFoundHelpful: number
}

export interface MockVendorReviewDashboard {
  averageRating: number
  totalReviews: number
  positiveReviews: number
  positiveRatio: number
  reviewedProducts: number
  starBreakdown: Record<string, number>
  reviews: MockVendorReviewItem[]
}

let reviewSeq = 0

export function makeVendorReviewItem(overrides: Partial<MockVendorReviewItem> = {}): MockVendorReviewItem {
  reviewSeq += 1
  return {
    id: `review-${reviewSeq}`,
    productId: "product-1",
    productName: "Dental Composite Kit",
    star: 5,
    title: "Great product",
    comment: "Works exactly as described, will buy again.",
    reviewerName: "Alex Buyer",
    reviewerClinic: "Bright Smile Dental",
    createdDate: "2026-08-20T10:00:00",
    peopleFoundHelpful: 2,
    ...overrides,
  }
}

export function makeVendorReviewDashboard(
  overrides: Partial<MockVendorReviewDashboard> = {},
): MockVendorReviewDashboard {
  const reviews = overrides.reviews ?? [makeVendorReviewItem()]
  return {
    averageRating: 4.5,
    totalReviews: reviews.length,
    positiveReviews: reviews.length,
    positiveRatio: 100,
    reviewedProducts: 1,
    starBreakdown: { "5": reviews.length },
    reviews,
    ...overrides,
  }
}

export function registerVendorReviewsMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/api/reviews/vendor", () => ({ body: makeVendorReviewDashboard() }))
}
