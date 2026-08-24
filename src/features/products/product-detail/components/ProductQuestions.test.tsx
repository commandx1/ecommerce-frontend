import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import type { Question, QuestionsResponse } from "../types"
import ProductQuestions from "./ProductQuestions"

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: "q-1",
  productId: "p-1",
  userId: "user-1",
  questionerName: "Serhat",
  userProductId: "up-1",
  sellerName: "Acme Dental",
  question: "Does it fit a 5ml syringe?",
  createdDate: "2026-08-20T10:00:00Z",
  answers: [],
  ...overrides,
})

const makeQuestionsResponse = (content: Question[]): QuestionsResponse => ({
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
})

const userProducts = [
  { id: "up-1", vendor: "Acme Dental" },
  { id: "up-2", vendor: "Beta Supplies" },
]

const renderQuestions = (questions: Question[], searchParams = "") =>
  render(
    <ProductQuestions
      productId="p-1"
      initialQuestions={makeQuestionsResponse(questions)}
      userProducts={userProducts}
    />,
    { route: "/products/p-1", searchParams },
  )

describe("ProductQuestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("invites the first question when there are none", () => {
    renderQuestions([])

    expect(screen.getByText("No questions yet. Be the first to ask a question!")).toBeInTheDocument()
  })

  it("lists the questions with their asker", () => {
    renderQuestions([makeQuestion()])

    expect(screen.getByRole("heading", { name: "Does it fit a 5ml syringe?" })).toBeInTheDocument()
    expect(screen.getByText(/Asked by Serhat/)).toBeInTheDocument()
  })

  it("marks an unanswered question as such", () => {
    renderQuestions([makeQuestion()])

    expect(screen.getByText("No answer yet.")).toBeInTheDocument()
  })

  it("shows every answer with its author", () => {
    renderQuestions([
      makeQuestion({
        answers: [
          {
            id: "a-1",
            productQuestionId: "q-1",
            answererUserId: "vendor-1",
            answererName: "Acme Support",
            answer: "Yes, it does.",
            createdDate: "2026-08-21T10:00:00Z",
          },
        ],
      }),
    ])

    expect(screen.getByText("Yes, it does.")).toBeInTheDocument()
    expect(screen.getByText("Acme Support")).toBeInTheDocument()
    expect(screen.queryByText("No answer yet.")).not.toBeInTheDocument()
  })

  it("narrows the list to the vendor named in the URL and counts both totals", () => {
    renderQuestions(
      [makeQuestion(), makeQuestion({ id: "q-2", userProductId: "up-2", question: "Is it latex free?" })],
      "vendorId=up-2",
    )

    expect(screen.getByText("Showing 1 of 2 questions")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Is it latex free?" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Does it fit a 5ml syringe?" })).not.toBeInTheDocument()
  })

  it("explains an empty list scoped to one vendor differently", () => {
    renderQuestions([makeQuestion({ userProductId: "up-1" })], "vendorId=up-2")

    expect(screen.getByText("No questions have been asked to this vendor yet.")).toBeInTheDocument()
  })

  it("shows every vendor's questions when the URL names no vendor", () => {
    renderQuestions([makeQuestion(), makeQuestion({ id: "q-2", userProductId: "up-2", question: "Is it latex free?" })])

    expect(screen.getByText("Showing 2 of 2 questions")).toBeInTheDocument()
  })
})
