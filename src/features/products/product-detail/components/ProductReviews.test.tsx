import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor } from "@/test/render"
import type { Review, ReviewsResponse } from "../types"
import ProductReviews from "./ProductReviews"

installRadixPointerPolyfills()

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const makeReview = (overrides: Partial<Review> = {}): Review => ({
  id: "review-1",
  productId: "p-1",
  userProductId: "up-1",
  vendorDisplayName: "Acme Dental",
  star: 5,
  userId: "user-1",
  username: "serhat",
  title: "Great tips",
  comment: "Exactly as described.",
  createdDate: "2026-08-20T10:00:00Z",
  peopleFoundHelpful: 3,
  ...overrides,
})

const makeReviewsResponse = (content: Review[], overrides: Partial<ReviewsResponse> = {}): ReviewsResponse => ({
  content,
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: { empty: true, sorted: false, unsorted: true },
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalPages: 1,
  totalElements: content.length,
  size: 10,
  number: 0,
  sort: { empty: true, sorted: false, unsorted: true },
  numberOfElements: content.length,
  first: true,
  empty: content.length === 0,
  ...overrides,
})

const userProducts = [
  { id: "up-1", vendor: "Acme Dental" },
  { id: "up-2", vendor: "Beta Supplies" },
]

const signIn = (id = "user-1") => {
  useAuthStore.getState().setAuth(makeAccountUser({ id }), "token-1", "refresh-1")
}

describe("ProductReviews", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastError.mockClear()
    mockToastSuccess.mockClear()
  })

  it("averages the visible reviews and says which scope they cover", () => {
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview({ star: 5 }), makeReview({ id: "review-2", star: 3 })])}
        userProducts={userProducts}
      />,
    )

    expect(screen.getByText("4.0")).toBeInTheDocument()
    expect(screen.getByText(/Based on 2 reviews across all vendors/)).toBeInTheDocument()
  })

  it("invites the first review when the product has none", () => {
    render(<ProductReviews productId="p-1" initialReviews={makeReviewsResponse([])} userProducts={userProducts} />)

    expect(screen.getByText("No reviews yet. Be the first to review this product!")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Rating Breakdown" })).not.toBeInTheDocument()
  })

  it("names the vendor the server-rendered slice belongs to", () => {
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        initialUserProductId="up-1"
        userProducts={userProducts}
      />,
    )

    expect(screen.getByText(/Based on 1 reviews for Acme Dental/)).toBeInTheDocument()
  })

  it("offers no vendor filter for a single-vendor product", () => {
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        userProducts={[userProducts[0]]}
      />,
    )

    expect(screen.queryByText("Show reviews for:")).not.toBeInTheDocument()
  })

  it("fetches a vendor's own slice when the filter changes", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    let requestedUserProductId: string | null = null
    server.use(
      http.get("*/api/reviews/product/:productId", ({ request }) => {
        requestedUserProductId = new URL(request.url).searchParams.get("userProductId")
        return HttpResponse.json(makeReviewsResponse([makeReview({ id: "review-9", title: "Beta review", star: 4 })]))
      }),
    )
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        userProducts={userProducts}
      />,
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Beta Supplies" }))

    expect(await screen.findByText("Beta review")).toBeInTheDocument()
    expect(requestedUserProductId).toBe("up-2")
    expect(screen.queryByText("Great tips")).not.toBeInTheDocument()
  })

  it("restores the previous filter and reports a failed fetch", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    server.use(http.get("*/api/reviews/product/:productId", () => new HttpResponse(null, { status: 500 })))
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        userProducts={userProducts}
      />,
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Beta Supplies" }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(screen.getByRole("combobox")).toHaveTextContent("All vendors")
    expect(screen.getByText("Great tips")).toBeInTheDocument()
  })

  it("returning to the server-rendered slice needs no request", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    let requests = 0
    server.use(
      http.get("*/api/reviews/product/:productId", () => {
        requests += 1
        return HttpResponse.json(makeReviewsResponse([]))
      }),
    )
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        initialUserProductId="up-1"
        userProducts={userProducts}
      />,
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "All vendors" }))
    await screen.findByText("No reviews yet. Be the first to review this product!")
    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Acme Dental" }))

    expect(await screen.findByText("Great tips")).toBeInTheDocument()
    expect(requests).toBe(1)
  })

  it("shows edit and delete only on the signed-in reader's own review", () => {
    signIn("user-1")
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([
          makeReview({ userId: "user-1" }),
          makeReview({ id: "review-2", userId: "someone-else", title: "Other review" }),
        ])}
        userProducts={userProducts}
      />,
    )

    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1)
  })

  it("hides edit and delete from an anonymous reader", () => {
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        userProducts={userProducts}
      />,
    )

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
  })

  it("deletes the reader's own review and refreshes the page data", async () => {
    const user = userEvent.setup()
    signIn("user-1")
    let deletedId: string | undefined
    server.use(
      http.delete("*/api/reviews/:reviewId", ({ params }) => {
        deletedId = String(params.reviewId)
        return new HttpResponse(null, { status: 200 })
      }),
      http.get("*/api/reviews/product/:productId", () => HttpResponse.json(makeReviewsResponse([]))),
    )
    const { router } = render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        userProducts={userProducts}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    expect(await screen.findByText(/Are you sure you want to delete your review/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Delete Review" }))

    await waitFor(() => expect(deletedId).toBe("review-1"))
    expect(mockToastSuccess).toHaveBeenCalledWith("Your review has been deleted.")
    expect(router.refresh).toHaveBeenCalled()
  })

  it("keeps the delete dialog open and reports a failed delete", async () => {
    const user = userEvent.setup()
    signIn("user-1")
    server.use(http.delete("*/api/reviews/:reviewId", () => new HttpResponse(null, { status: 500 })))
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()])}
        userProducts={userProducts}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    await user.click(screen.getByRole("button", { name: "Delete Review" }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(screen.getByRole("button", { name: "Delete Review" })).toBeInTheDocument()
  })

  it("offers Load More only while the backend reports another page", () => {
    render(
      <ProductReviews
        productId="p-1"
        initialReviews={makeReviewsResponse([makeReview()], { last: false })}
        userProducts={userProducts}
      />,
    )

    expect(screen.getByRole("button", { name: "Load More Reviews" })).toBeInTheDocument()
  })
})
