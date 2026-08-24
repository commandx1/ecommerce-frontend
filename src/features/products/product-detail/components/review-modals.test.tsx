import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import AskQuestionModal from "./AskQuestionModal"
import EditReviewModal from "./EditReviewModal"
import WriteReviewModal from "./WriteReviewModal"

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

const signIn = () => useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")

const userProducts = [{ id: "up-1", vendor: "Acme Dental" }]

/**
 * The 1-5 rating stars are icon-only buttons with no accessible name; index 0 is the modal's
 * close control, so star N is button index N.
 */
const starButton = (star: number) => screen.getAllByRole("button")[star]

beforeEach(() => {
  vi.restoreAllMocks()
  mockToastError.mockClear()
  mockToastSuccess.mockClear()
})

describe("WriteReviewModal", () => {
  const renderModal = (props: Partial<Parameters<typeof WriteReviewModal>[0]> = {}) => {
    const handlers = { onClose: vi.fn(), onSuccess: vi.fn() }
    render(
      <WriteReviewModal
        productId="p-1"
        userProductId="up-1"
        vendorName="Acme Dental"
        isOpen
        {...handlers}
        {...props}
      />,
    )
    return handlers
  }

  it("asks an anonymous visitor to log in instead of showing the form", () => {
    renderModal()

    expect(screen.getByText("You need to log in to write a review.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Log In to Write Review/i })).toHaveAttribute("href", "/login")
    expect(screen.queryByLabelText(/Review Title/)).not.toBeInTheDocument()
  })

  it("explains that a vendor must be picked before a review can be written", () => {
    signIn()
    renderModal({ userProductId: undefined })

    expect(screen.getByText("Please select a vendor from the supplier table first.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Submit Review/i })).not.toBeInTheDocument()
  })

  it("names the vendor the review will be attributed to", () => {
    signIn()
    renderModal()

    expect(screen.getByText("Acme Dental")).toBeInTheDocument()
  })

  it("refuses to submit without a star rating", async () => {
    const user = userEvent.setup()
    signIn()
    let posted = false
    server.use(
      http.post("*/api/reviews", () => {
        posted = true
        return new HttpResponse(null, { status: 200 })
      }),
    )
    renderModal()

    await user.type(screen.getByLabelText("Review Title *"), "Great")
    await user.type(screen.getByLabelText("Your Review *"), "Works well")
    await user.click(screen.getByRole("button", { name: /Submit Review/i }))

    expect(mockToastError).toHaveBeenCalledWith("Please select a rating")
    expect(posted).toBe(false)
  })

  it("refuses to submit a whitespace-only title", async () => {
    const user = userEvent.setup()
    signIn()
    renderModal()

    await user.click(starButton(2))
    await user.type(screen.getByLabelText("Review Title *"), "   ")
    await user.type(screen.getByLabelText("Your Review *"), "Works well")
    await user.click(screen.getByRole("button", { name: /Submit Review/i }))

    expect(mockToastError).toHaveBeenCalledWith("Please enter a review title")
  })

  it("posts a trimmed review for the chosen vendor and closes", async () => {
    const user = userEvent.setup()
    signIn()
    let body: unknown = null
    server.use(
      http.post("*/api/reviews", async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const handlers = renderModal()

    await user.click(starButton(5))
    await user.type(screen.getByLabelText("Review Title *"), "  Great tips  ")
    await user.type(screen.getByLabelText("Your Review *"), "  Exactly as described.  ")
    await user.click(screen.getByRole("button", { name: /Submit Review/i }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({
      productId: "p-1",
      userProductId: "up-1",
      title: "Great tips",
      comment: "Exactly as described.",
    })
    expect(handlers.onClose).toHaveBeenCalled()
    expect(handlers.onSuccess).toHaveBeenCalled()
  })

  it("keeps the form open and reports a failed submit", async () => {
    const user = userEvent.setup()
    signIn()
    server.use(http.post("*/api/reviews", () => new HttpResponse(null, { status: 500 })))
    const handlers = renderModal()

    await user.click(starButton(2))
    await user.type(screen.getByLabelText("Review Title *"), "Great")
    await user.type(screen.getByLabelText("Your Review *"), "Works well")
    await user.click(screen.getByRole("button", { name: /Submit Review/i }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(handlers.onSuccess).not.toHaveBeenCalled()
  })
})

describe("EditReviewModal", () => {
  const review = { id: "review-1", star: 4, title: "Good", comment: "Solid product" }

  it("opens pre-filled with the review being edited", () => {
    signIn()
    render(<EditReviewModal review={review} isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)

    expect(screen.getByLabelText("Review Title *")).toHaveValue("Good")
    expect(screen.getByLabelText("Your Review *")).toHaveValue("Solid product")
  })

  it("sends the edited title and comment for that review id", async () => {
    const user = userEvent.setup()
    signIn()
    let body: unknown = null
    let requestedId: string | undefined
    server.use(
      http.put("*/api/reviews/:reviewId", async ({ request, params }) => {
        requestedId = String(params.reviewId)
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const onSuccess = vi.fn()
    render(<EditReviewModal review={review} isOpen onClose={vi.fn()} onSuccess={onSuccess} />)

    await user.clear(screen.getByLabelText("Review Title *"))
    await user.type(screen.getByLabelText("Review Title *"), "Even better")
    await user.click(screen.getByRole("button", { name: /Update Review/i }))

    await waitFor(() => expect(requestedId).toBe("review-1"))
    expect(body).toMatchObject({ star: 4, title: "Even better", comment: "Solid product" })
    expect(onSuccess).toHaveBeenCalled()
  })

  it("refuses to save an emptied comment", async () => {
    const user = userEvent.setup()
    signIn()
    render(<EditReviewModal review={review} isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)

    await user.clear(screen.getByLabelText("Your Review *"))
    await user.click(screen.getByRole("button", { name: /Update Review/i }))

    expect(mockToastError).toHaveBeenCalledWith("Please enter your review")
  })
})

describe("AskQuestionModal", () => {
  const renderModal = (props: Partial<Parameters<typeof AskQuestionModal>[0]> = {}) => {
    const handlers = { onClose: vi.fn(), onSuccess: vi.fn() }
    render(
      <AskQuestionModal
        productId="p-1"
        userProducts={userProducts}
        preSelectedUserProductId="up-1"
        isOpen
        {...handlers}
        {...props}
      />,
    )
    return handlers
  }

  it("asks an anonymous visitor to log in", () => {
    renderModal()

    expect(screen.getByText("You need to log in to ask a question.")).toBeInTheDocument()
  })

  it("requires a vendor before a question can be asked", () => {
    signIn()
    renderModal({ preSelectedUserProductId: undefined })

    expect(screen.getByText("Please select a vendor from the supplier table first.")).toBeInTheDocument()
  })

  it("refuses to submit an empty question", async () => {
    const user = userEvent.setup()
    signIn()
    renderModal()

    await user.click(screen.getByRole("button", { name: /Submit Question/i }))

    expect(mockToastError).toHaveBeenCalledWith("Please enter your question")
  })

  it("posts a trimmed question for the selected vendor", async () => {
    const user = userEvent.setup()
    signIn()
    let body: unknown = null
    server.use(
      http.post("*/api/product-questions", async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const handlers = renderModal()

    await user.type(screen.getByLabelText("Your Question *"), "  Does it fit a 5ml syringe?  ")
    await user.click(screen.getByRole("button", { name: /Submit Question/i }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({
      productId: "p-1",
      userProductId: "up-1",
      question: "Does it fit a 5ml syringe?",
    })
    expect(handlers.onSuccess).toHaveBeenCalled()
  })
})
