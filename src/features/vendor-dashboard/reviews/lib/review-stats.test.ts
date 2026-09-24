import { describe, expect, it } from "vitest"
import type { VendorReviewItem } from "@/lib/api/vendor-reviews"
import { computeRatingBreakdown, filterReviewsByStar, normalizeReviews, STAR_STEPS } from "./review-stats"

const review = (overrides: Partial<VendorReviewItem> = {}): VendorReviewItem => ({
  id: "r-1",
  productId: "p-1",
  productName: "Composite Kit",
  star: 5,
  title: "Excellent",
  comment: "Works exactly as described.",
  reviewerName: "Jane Doe",
  reviewerClinic: "Pacific Dental",
  createdDate: "2026-08-01T10:00:00Z",
  peopleFoundHelpful: 3,
  ...overrides,
})

describe("computeRatingBreakdown", () => {
  it("returns one entry per star step, 5 down to 1, in that order", () => {
    const breakdown = computeRatingBreakdown({ "5": 1, "4": 1, "3": 0, "2": 0, "1": 0 }, 2)
    expect(breakdown.map((entry) => entry.stars)).toEqual([...STAR_STEPS])
  })

  it("reads the count for each star from the starBreakdown record, defaulting missing keys to 0", () => {
    const breakdown = computeRatingBreakdown({ "5": 3, "3": 1 }, 4)
    expect(breakdown).toEqual([
      { stars: 5, count: 3, percentage: 75 },
      { stars: 4, count: 0, percentage: 0 },
      { stars: 3, count: 1, percentage: 25 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ])
  })

  it("treats a missing starBreakdown as all zeros", () => {
    const breakdown = computeRatingBreakdown(undefined, 0)
    expect(breakdown.every((entry) => entry.count === 0 && entry.percentage === 0)).toBe(true)
  })

  it("computes 0% for every bucket when there are no reviews at all, instead of dividing by zero", () => {
    const breakdown = computeRatingBreakdown({ "5": 0 }, 0)
    expect(breakdown.every((entry) => entry.percentage === 0)).toBe(true)
  })

  it.each([
    [{ "5": 1, "4": 1, "3": 1, "2": 1, "1": 1 }, 5, 20],
    [{ "5": 2, "4": 0, "3": 0, "2": 0, "1": 0 }, 2, 100],
    [{ "5": 1, "4": 3 }, 4, 25],
  ])("percentage for star=%o with total=%i is %i", (starBreakdown, total, expectedFivePercentage) => {
    const breakdown = computeRatingBreakdown(starBreakdown, total)
    const fiveStar = breakdown.find((entry) => entry.stars === 5)
    expect(fiveStar?.percentage).toBe(expectedFivePercentage)
  })
})

describe("filterReviewsByStar", () => {
  const reviews = [review({ id: "r-1", star: 5 }), review({ id: "r-2", star: 4 }), review({ id: "r-3", star: 5 })]

  it("returns every review unfiltered when selectedStar is null", () => {
    expect(filterReviewsByStar(reviews, null)).toEqual(reviews)
  })

  it("keeps only reviews matching the selected star count", () => {
    expect(filterReviewsByStar(reviews, 5).map((r) => r.id)).toEqual(["r-1", "r-3"])
  })

  it("returns an empty array when nothing matches the selected star", () => {
    expect(filterReviewsByStar(reviews, 1)).toEqual([])
  })

  it("returns an empty array unchanged when given an empty review list", () => {
    expect(filterReviewsByStar([], 5)).toEqual([])
  })
})

describe("normalizeReviews", () => {
  it("passes an array of reviews through unchanged", () => {
    const reviews = [review()]
    expect(normalizeReviews(reviews)).toBe(reviews)
  })

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a non-array object", { 0: review() }],
    ["a string", "not an array"],
  ])("returns an empty array instead of crashing when reviews is %s", (_label, value) => {
    expect(normalizeReviews(value)).toEqual([])
  })
})
