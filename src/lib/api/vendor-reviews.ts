export interface VendorReviewItem {
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

export interface VendorReviewDashboard {
  averageRating: number
  totalReviews: number
  positiveReviews: number
  positiveRatio: number
  reviewedProducts: number
  starBreakdown: Record<string, number>
  reviews: VendorReviewItem[]
}

export async function getVendorReviewDashboard(accessToken: string): Promise<VendorReviewDashboard | null> {
  try {
    const response = await fetch("/api/reviews/vendor", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
