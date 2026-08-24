import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  ProductAnswerResponse,
  ProductQuestionResponse,
  SellerQuestionCounts,
  SellerQuestionsPage,
} from "@/lib/api/vendor-questions"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import VendorQuestionsPage from "./page"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const VENDOR_USER_ID = "vendor-user-1"

const makeAnswer = (overrides: Partial<ProductAnswerResponse> = {}): ProductAnswerResponse => ({
  id: "a-1",
  productQuestionId: "q-1",
  answererUserId: VENDOR_USER_ID,
  answererName: "serhat belen",
  answer: "Yes, it ships with two extra tips.",
  createdDate: "2026-08-22T09:00:00Z",
  ...overrides,
})

const makeQuestion = (overrides: Partial<ProductQuestionResponse> = {}): ProductQuestionResponse => ({
  id: "q-1",
  productId: "p-1",
  productName: "Composite Kit",
  userId: "buyer-1",
  questionerName: "jane doe",
  userProductId: "up-1",
  sellerName: "Acme Dental",
  question: "Does this kit include extra mixing tips?",
  createdDate: "2026-08-23T08:00:00Z",
  answers: [],
  ...overrides,
})

const makePage = (
  content: ProductQuestionResponse[],
  overrides: Partial<SellerQuestionsPage> = {},
): SellerQuestionsPage => ({
  content,
  totalPages: 1,
  totalElements: content.length,
  number: 0,
  size: 10,
  ...overrides,
})

interface ServeOptions {
  counts?: SellerQuestionCounts | "fail"
  questionsStatus?: number
}

/** Records every `GET /product-questions/seller` query so filter/pagination wiring can be asserted. */
const questionRequests: URLSearchParams[] = []

const serveQuestions = (
  pageFor: (params: URLSearchParams) => SellerQuestionsPage,
  { counts = { total: 1, answered: 0, unanswered: 1 }, questionsStatus = 200 }: ServeOptions = {},
) => {
  server.use(
    http.get("*/backend-api/product-questions/seller", ({ request }) => {
      const params = new URL(request.url).searchParams
      questionRequests.push(params)
      if (questionsStatus !== 200) {
        return new HttpResponse(null, { status: questionsStatus })
      }
      return HttpResponse.json(pageFor(params))
    }),
    http.get("*/backend-api/product-questions/seller/counts", () => {
      if (counts === "fail") return new HttpResponse(null, { status: 500 })
      return HttpResponse.json(counts)
    }),
  )
}

const serveStaticQuestions = (content: ProductQuestionResponse[], options?: ServeOptions) =>
  serveQuestions(() => makePage(content), options)

/**
 * The edit/delete controls on an answered card are icon-only `<button>`s with no `aria-label`,
 * `title` or visible text, so there is no accessible name to query by. Selecting them by their
 * empty accessible name is deliberate — it locks the current (inaccessible) markup. See BULGULAR.
 */
const answerIconButtons = () => screen.getAllByRole("button").filter((button) => button.textContent === "")

const authenticateVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ id: VENDOR_USER_ID, roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  questionRequests.length = 0
  authenticateVendor()
})

describe("VendorQuestionsPage", () => {
  describe("access and loading", () => {
    it("asks unauthenticated visitors to log in instead of calling the questions API", () => {
      useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })

      render(<VendorQuestionsPage />)

      expect(screen.getByText("Please log in to view questions.")).toBeInTheDocument()
      expect(questionRequests).toHaveLength(0)
    })

    it("lists each question with its product, asker and relative age", async () => {
      serveStaticQuestions([
        makeQuestion(),
        makeQuestion({ id: "q-2", productName: "Curing Light", question: "Is the battery replaceable?" }),
      ])

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("Does this kit include extra mixing tips?")).toBeInTheDocument()
      expect(screen.getByText("Is the battery replaceable?")).toBeInTheDocument()
      expect(screen.getByText("Composite Kit")).toBeInTheDocument()
      expect(screen.getByText("Curing Light")).toBeInTheDocument()
      expect(screen.getAllByText("jane doe").length).toBe(2)
    })

    it("falls back to a generic product label when the question has no product name", async () => {
      serveStaticQuestions([makeQuestion({ productName: null })])

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("Product")).toBeInTheDocument()
    })

    it("highlights the outstanding workload with the unanswered badge", async () => {
      serveStaticQuestions([makeQuestion()], { counts: { total: 5, answered: 2, unanswered: 3 } })

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("3 unanswered")).toBeInTheDocument()
    })

    it("hides the unanswered badge when the vendor is fully caught up", async () => {
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })], {
        counts: { total: 1, answered: 1, unanswered: 0 },
      })

      render(<VendorQuestionsPage />)

      await screen.findByText("Does this kit include extra mixing tips?")
      expect(screen.queryByText(/unanswered$/)).not.toBeInTheDocument()
    })

    it("keeps rendering the list when the counts endpoint fails, only dropping the tab badges", async () => {
      serveStaticQuestions([makeQuestion()], { counts: "fail" })

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("Does this kit include extra mixing tips?")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument()
      expect(toastSpies.error).not.toHaveBeenCalled()
    })
  })

  describe("filtering", () => {
    it("labels each tab with its share of the counts", async () => {
      serveStaticQuestions([makeQuestion()], { counts: { total: 12, answered: 7, unanswered: 5 } })

      render(<VendorQuestionsPage />)

      expect(await screen.findByRole("button", { name: "All 12" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Unanswered 5" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Answered 7" })).toBeInTheDocument()
    })

    it("requests only unanswered questions when that tab is selected", async () => {
      const user = userEvent.setup()
      serveQuestions((params) =>
        params.get("answered") === "false"
          ? makePage([makeQuestion({ id: "q-open", question: "Still waiting on a reply?" })])
          : makePage([makeQuestion()]),
      )

      render(<VendorQuestionsPage />)
      await screen.findByText("Does this kit include extra mixing tips?")

      await user.click(screen.getByRole("button", { name: /^Unanswered/ }))

      expect(await screen.findByText("Still waiting on a reply?")).toBeInTheDocument()
      expect(questionRequests.at(-1)?.get("answered")).toBe("false")
      expect(screen.getByRole("button", { name: /^Unanswered/ })).toHaveAttribute("aria-pressed", "true")
    })

    it("requests only answered questions when that tab is selected", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])

      render(<VendorQuestionsPage />)
      await screen.findByText("Does this kit include extra mixing tips?")

      await user.click(screen.getByRole("button", { name: /^Answered/ }))

      await waitFor(() => expect(questionRequests.at(-1)?.get("answered")).toBe("true"))
    })

    it("omits the answered flag entirely on the All tab", async () => {
      serveStaticQuestions([makeQuestion()])

      render(<VendorQuestionsPage />)
      await screen.findByText("Does this kit include extra mixing tips?")

      expect(questionRequests[0]?.has("answered")).toBe(false)
      expect(questionRequests[0]?.get("size")).toBe("10")
    })

    it("returns to the first page when the filter changes", async () => {
      const user = userEvent.setup()
      serveQuestions(() => makePage([makeQuestion()], { totalPages: 3, totalElements: 25 }))

      render(<VendorQuestionsPage />)
      await screen.findByText("Does this kit include extra mixing tips?")

      await user.click(screen.getByRole("button", { name: "2" }))
      await waitFor(() => expect(questionRequests.at(-1)?.get("page")).toBe("1"))

      await user.click(screen.getByRole("button", { name: /^Unanswered/ }))

      await waitFor(() => expect(questionRequests.at(-1)?.get("page")).toBe("0"))
    })

    it("explains an empty unanswered tab differently from an empty inbox", async () => {
      const user = userEvent.setup()
      serveQuestions((params) => (params.get("answered") === "false" ? makePage([]) : makePage([makeQuestion()])))

      render(<VendorQuestionsPage />)
      await screen.findByText("Does this kit include extra mixing tips?")

      await user.click(screen.getByRole("button", { name: /^Unanswered/ }))

      expect(await screen.findByText("No unanswered questions")).toBeInTheDocument()
      expect(screen.getByText("Switch to a different filter to see other questions.")).toBeInTheDocument()
    })

    it("invites the vendor to wait for traffic when there are no questions at all", async () => {
      serveStaticQuestions([], { counts: { total: 0, answered: 0, unanswered: 0 } })

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("No questions yet")).toBeInTheDocument()
      expect(screen.getByText("Customer questions about your products will appear here.")).toBeInTheDocument()
    })
  })

  describe("pagination", () => {
    it("summarises the visible slice and fetches the next page on demand", async () => {
      const user = userEvent.setup()
      serveQuestions((params) =>
        makePage([makeQuestion({ id: `q-${params.get("page")}`, question: `Page ${params.get("page")} question` })], {
          totalPages: 3,
          totalElements: 25,
        }),
      )

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("Showing 1 to 10 of 25 results")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "2" }))

      expect(await screen.findByText("Page 1 question")).toBeInTheDocument()
      expect(screen.getByText("Showing 11 to 20 of 25 results")).toBeInTheDocument()
    })

    it("hides pagination when a load fails and leaves zero pages", async () => {
      serveStaticQuestions([], { questionsStatus: 500 })

      render(<VendorQuestionsPage />)

      await waitFor(() => expect(toastSpies.error).toHaveBeenCalled())
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
    })
  })

  describe("error handling", () => {
    it("tells the vendor to refresh and shows the empty state when the list request fails", async () => {
      serveStaticQuestions([], { questionsStatus: 500 })

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("No questions yet")).toBeInTheDocument()
      expect(toastSpies.error).toHaveBeenCalledWith("Failed to load questions", "Please refresh the page.")
    })
  })

  describe("answering a question", () => {
    it("posts a new answer and shows it in place of the compose button", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion()])
      server.use(
        http.post("*/backend-api/product-answers", async ({ request }) => {
          const body = (await request.json()) as { productQuestionId: string; answer: string }
          return HttpResponse.json(makeAnswer({ productQuestionId: body.productQuestionId, answer: body.answer }), {
            status: 201,
          })
        }),
      )

      render(<VendorQuestionsPage />)

      await user.click(await screen.findByRole("button", { name: "Write an answer" }))
      await user.type(screen.getByPlaceholderText("Type your answer here..."), "Yes, two extra tips are included.")
      await user.click(screen.getByRole("button", { name: "Submit answer" }))

      expect(await screen.findByText("Yes, two extra tips are included.")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Write an answer" })).not.toBeInTheDocument()
      expect(screen.getByText("Answer")).toBeInTheDocument()
    })

    it("refreshes the unanswered badge after an answer is submitted", async () => {
      const user = userEvent.setup()
      let countsCalls = 0
      server.use(
        http.get("*/backend-api/product-questions/seller", () => HttpResponse.json(makePage([makeQuestion()]))),
        http.get("*/backend-api/product-questions/seller/counts", () => {
          countsCalls += 1
          return HttpResponse.json(
            countsCalls === 1 ? { total: 2, answered: 0, unanswered: 2 } : { total: 2, answered: 1, unanswered: 1 },
          )
        }),
        http.post("*/backend-api/product-answers", () => HttpResponse.json(makeAnswer({ answer: "Sure." }))),
      )

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("2 unanswered")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Write an answer" }))
      await user.type(screen.getByPlaceholderText("Type your answer here..."), "Sure.")
      await user.click(screen.getByRole("button", { name: "Submit answer" }))

      expect(await screen.findByText("1 unanswered")).toBeInTheDocument()
    })

    it("keeps the submit button disabled until the draft has non-whitespace content", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion()])

      render(<VendorQuestionsPage />)

      await user.click(await screen.findByRole("button", { name: "Write an answer" }))
      expect(screen.getByRole("button", { name: "Submit answer" })).toBeDisabled()

      await user.type(screen.getByPlaceholderText("Type your answer here..."), "   ")
      expect(screen.getByRole("button", { name: "Submit answer" })).toBeDisabled()

      await user.type(screen.getByPlaceholderText("Type your answer here..."), "ok")
      expect(screen.getByRole("button", { name: "Submit answer" })).toBeEnabled()
    })

    it("discards the draft when the compose form is cancelled", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion()])

      render(<VendorQuestionsPage />)

      await user.click(await screen.findByRole("button", { name: "Write an answer" }))
      await user.type(screen.getByPlaceholderText("Type your answer here..."), "half written")
      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(screen.getByRole("button", { name: "Write an answer" })).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Write an answer" }))
      expect(screen.getByPlaceholderText("Type your answer here...")).toHaveValue("")
    })

    it("keeps the draft on screen and warns when the create request fails", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion()])
      server.use(http.post("*/backend-api/product-answers", () => new HttpResponse(null, { status: 500 })))

      render(<VendorQuestionsPage />)

      await user.click(await screen.findByRole("button", { name: "Write an answer" }))
      await user.type(screen.getByPlaceholderText("Type your answer here..."), "This will fail.")
      await user.click(screen.getByRole("button", { name: "Submit answer" }))

      await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to save answer", "Please try again."))
      expect(screen.getByPlaceholderText("Type your answer here...")).toHaveValue("This will fail.")
    })

    it("trims the submitted answer before sending it to the API", async () => {
      const user = userEvent.setup()
      const sent: string[] = []
      serveStaticQuestions([makeQuestion()])
      server.use(
        http.post("*/backend-api/product-answers", async ({ request }) => {
          const body = (await request.json()) as { answer: string }
          sent.push(body.answer)
          return HttpResponse.json(makeAnswer({ answer: body.answer }))
        }),
      )

      render(<VendorQuestionsPage />)

      await user.click(await screen.findByRole("button", { name: "Write an answer" }))
      await user.type(screen.getByPlaceholderText("Type your answer here..."), "  padded answer  ")
      await user.click(screen.getByRole("button", { name: "Submit answer" }))

      await waitFor(() => expect(sent).toEqual(["padded answer"]))
    })
  })

  describe("editing and deleting an answer", () => {
    it("shows the existing answer with its author instead of a compose button", async () => {
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("Yes, it ships with two extra tips.")).toBeInTheDocument()
      expect(screen.getByText("serhat belen")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Write an answer" })).not.toBeInTheDocument()
    })

    it("offers no edit or delete controls on an answer written by someone else", async () => {
      serveStaticQuestions([
        makeQuestion({ answers: [makeAnswer({ answererUserId: "other-vendor", answererName: "colleague" })] }),
      ])

      render(<VendorQuestionsPage />)

      await screen.findByText("Yes, it ships with two extra tips.")
      expect(answerIconButtons()).toHaveLength(0)
    })

    it("pre-fills the editor with the current answer and saves the update", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])
      server.use(
        http.put("*/backend-api/product-answers/a-1", async ({ request }) => {
          const body = (await request.json()) as { answer: string }
          return HttpResponse.json(makeAnswer({ answer: body.answer }))
        }),
      )

      render(<VendorQuestionsPage />)
      await screen.findByText("Yes, it ships with two extra tips.")

      const [editButton] = answerIconButtons()
      await user.click(editButton as HTMLElement)

      const textarea = screen.getByPlaceholderText("Type your answer here...")
      expect(textarea).toHaveValue("Yes, it ships with two extra tips.")
      expect(screen.getByText("Edit answer")).toBeInTheDocument()

      await user.clear(textarea)
      await user.type(textarea, "Yes, three extra tips are included.")
      await user.click(screen.getByRole("button", { name: "Save changes" }))

      expect(await screen.findByText("Yes, three extra tips are included.")).toBeInTheDocument()
      expect(screen.queryByPlaceholderText("Type your answer here...")).not.toBeInTheDocument()
    })

    it("restores the saved answer when an edit is cancelled", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])

      render(<VendorQuestionsPage />)
      await screen.findByText("Yes, it ships with two extra tips.")

      await user.click(answerIconButtons()[0] as HTMLElement)
      await user.clear(screen.getByPlaceholderText("Type your answer here..."))
      await user.type(screen.getByPlaceholderText("Type your answer here..."), "throwaway")
      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(screen.getByText("Yes, it ships with two extra tips.")).toBeInTheDocument()
      expect(screen.queryByText("throwaway")).not.toBeInTheDocument()
    })

    it("warns and keeps the editor open when the update request fails", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])
      server.use(http.put("*/backend-api/product-answers/a-1", () => new HttpResponse(null, { status: 500 })))

      render(<VendorQuestionsPage />)
      await screen.findByText("Yes, it ships with two extra tips.")

      await user.click(answerIconButtons()[0] as HTMLElement)
      await user.type(screen.getByPlaceholderText("Type your answer here..."), " and a spatula")
      await user.click(screen.getByRole("button", { name: "Save changes" }))

      await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to save answer", "Please try again."))
      expect(screen.getByPlaceholderText("Type your answer here...")).toBeInTheDocument()
    })

    it("asks for confirmation before deleting and can be dismissed without a request", async () => {
      const user = userEvent.setup()
      let deleteCalls = 0
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])
      server.use(
        http.delete("*/backend-api/product-answers/a-1", () => {
          deleteCalls += 1
          return new HttpResponse(null, { status: 204 })
        }),
      )

      render(<VendorQuestionsPage />)
      await screen.findByText("Yes, it ships with two extra tips.")

      await user.click(answerIconButtons()[1] as HTMLElement)

      const dialog = await screen.findByRole("dialog")
      expect(
        within(dialog).getByText("Are you sure you want to delete this answer? This action cannot be undone."),
      ).toBeInTheDocument()

      await user.click(within(dialog).getByRole("button", { name: "Keep it" }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(deleteCalls).toBe(0)
      expect(screen.getByText("Yes, it ships with two extra tips.")).toBeInTheDocument()
    })

    it("removes the answer and re-offers the compose button once deletion is confirmed", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])
      server.use(http.delete("*/backend-api/product-answers/a-1", () => new HttpResponse(null, { status: 204 })))

      render(<VendorQuestionsPage />)
      await screen.findByText("Yes, it ships with two extra tips.")

      await user.click(answerIconButtons()[1] as HTMLElement)
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }))

      expect(await screen.findByRole("button", { name: "Write an answer" })).toBeInTheDocument()
      expect(screen.queryByText("Yes, it ships with two extra tips.")).not.toBeInTheDocument()
    })

    it("keeps the answer and warns when the delete request fails", async () => {
      const user = userEvent.setup()
      serveStaticQuestions([makeQuestion({ answers: [makeAnswer()] })])
      server.use(http.delete("*/backend-api/product-answers/a-1", () => new HttpResponse(null, { status: 500 })))

      render(<VendorQuestionsPage />)
      await screen.findByText("Yes, it ships with two extra tips.")

      await user.click(answerIconButtons()[1] as HTMLElement)
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }))

      await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to delete answer", "Please try again."))
      expect(screen.getByText("Yes, it ships with two extra tips.")).toBeInTheDocument()
    })

    /**
     * Suspicious: only `answers[0]` is ever rendered. A question carrying more than one answer
     * silently hides the rest, and the edit/delete controls always target the first one.
     * Locking current behaviour — see BULGULAR.
     */
    it("renders only the first answer when a question has several", async () => {
      serveStaticQuestions([
        makeQuestion({
          answers: [makeAnswer(), makeAnswer({ id: "a-2", answer: "A second opinion from a colleague." })],
        }),
      ])

      render(<VendorQuestionsPage />)

      expect(await screen.findByText("Yes, it ships with two extra tips.")).toBeInTheDocument()
      expect(screen.queryByText("A second opinion from a colleague.")).not.toBeInTheDocument()
    })
  })
})
