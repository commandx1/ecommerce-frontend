import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { makeVendorReviewDashboard, makeVendorReviewItem } from "./mocks/vendor-reviews.mocks"
import { VendorReviewsPage } from "./pages/vendor-reviews.page"

test.describe("vendor reviews", () => {
  test("review list and rating distribution load from the vendor dashboard", async ({ vendorPage, apiMock }) => {
    const review = makeVendorReviewItem({
      id: "review-1",
      title: "Excellent kit",
      productName: "Dental Composite Kit",
      star: 5,
      comment: "Works exactly as described.",
      reviewerName: "Alex Buyer",
    })
    const dashboard = makeVendorReviewDashboard({
      averageRating: 4.5,
      totalReviews: 1,
      positiveReviews: 1,
      positiveRatio: 100,
      reviewedProducts: 1,
      starBreakdown: { "5": 1 },
      reviews: [review],
    })
    apiMock.on("GET", "/api/reviews/vendor", () => ({ body: dashboard }))
    registerAllMocks(apiMock)

    const reviews = new VendorReviewsPage(vendorPage)
    await reviews.goto()

    await expect(reviews.mainHeading).toHaveText("Reviews")
    await expect(reviews.reviewCard("Excellent kit")).toBeVisible()
    await expect(reviews.reviewCard("Excellent kit")).toContainText("Alex Buyer")

    await expect(reviews.kpiValue("Across vendor product reviews")).toHaveText("4.5")
    await expect(reviews.kpiValue("All review records in this feed")).toHaveText("1")
    await expect(reviews.kpiValue("4-5 star review share")).toHaveText("100%")
    await expect(reviews.ratingRow(5)).toContainText("1")

    // Selecting a star row narrows the list to reviews with that rating.
    await reviews.ratingRow(5).click()
    await expect(reviews.reviewCard("Excellent kit")).toBeVisible()
  })

  test("shows an empty state when the vendor has no reviews yet", async ({ vendorPage, apiMock }) => {
    const dashboard = makeVendorReviewDashboard({
      averageRating: 0,
      totalReviews: 0,
      positiveReviews: 0,
      positiveRatio: 0,
      reviewedProducts: 0,
      starBreakdown: {},
      reviews: [],
    })
    apiMock.on("GET", "/api/reviews/vendor", () => ({ body: dashboard }))
    registerAllMocks(apiMock)

    const reviews = new VendorReviewsPage(vendorPage)
    await reviews.goto()

    await expect(reviews.emptyState).toBeVisible()
    await expect(reviews.kpiValue("All review records in this feed")).toHaveText("0")
  })

  test("shows an understandable error instead of the raw backend response when the review feed fails", async ({
    vendorPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/api/reviews/vendor", () => ({
      status: 500,
      body: { message: "TransactionSystemException: could not execute statement" },
    }))
    registerAllMocks(apiMock)

    const reviews = new VendorReviewsPage(vendorPage)
    await reviews.goto()

    await expect(reviews.errorBanner).toBeVisible()
    await expect(vendorPage.getByText("TransactionSystemException")).toHaveCount(0)
  })
})
