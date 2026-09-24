import { describe, expect, it } from "vitest"
import type { ProductAnswerResponse, ProductQuestionResponse, SellerQuestionsPage } from "@/lib/api/vendor-questions"
import { patchAnswerCreated, patchAnswerDeleted, patchAnswerUpdated } from "./question-patches"

const answer = (overrides: Partial<ProductAnswerResponse> = {}): ProductAnswerResponse => ({
  id: "a-1",
  productQuestionId: "q-1",
  answererUserId: "vendor-1",
  answererName: "Vendor",
  answer: "Yes.",
  createdDate: "2026-08-01T10:00:00Z",
  ...overrides,
})

const question = (overrides: Partial<ProductQuestionResponse> = {}): ProductQuestionResponse => ({
  id: "q-1",
  productId: "p-1",
  productName: "Composite Kit",
  userId: "buyer-1",
  questionerName: "Jane",
  userProductId: "up-1",
  sellerName: "Acme",
  question: "Does it include tips?",
  createdDate: "2026-08-01T09:00:00Z",
  answers: [],
  ...overrides,
})

const page = (content: ProductQuestionResponse[]): SellerQuestionsPage => ({
  content,
  totalPages: 1,
  totalElements: content.length,
  number: 0,
  size: 10,
})

describe("patchAnswerCreated", () => {
  it("prepends the new answer to the matching question's answers", () => {
    const before = page([question({ id: "q-1", answers: [] }), question({ id: "q-2", answers: [] })])

    const after = patchAnswerCreated(before, "q-1", answer({ id: "a-new" }))

    expect(after.content.find((q) => q.id === "q-1")?.answers.map((a) => a.id)).toEqual(["a-new"])
    expect(after.content.find((q) => q.id === "q-2")?.answers).toEqual([])
  })

  it("keeps existing answers, with the new one first", () => {
    const before = page([question({ id: "q-1", answers: [answer({ id: "a-old" })] })])

    const after = patchAnswerCreated(before, "q-1", answer({ id: "a-new" }))

    expect(after.content[0]?.answers.map((a) => a.id)).toEqual(["a-new", "a-old"])
  })

  it("leaves every other field on the page untouched", () => {
    const before = page([question({ id: "q-1" })])
    const after = patchAnswerCreated(before, "q-1", answer())
    expect(after.totalPages).toBe(before.totalPages)
    expect(after.totalElements).toBe(before.totalElements)
  })
})

describe("patchAnswerUpdated", () => {
  it("replaces only the matching answer by id, leaving sibling answers untouched", () => {
    const before = page([
      question({ id: "q-1", answers: [answer({ id: "a-1", answer: "old" }), answer({ id: "a-2", answer: "other" })] }),
    ])

    const after = patchAnswerUpdated(before, "q-1", answer({ id: "a-1", answer: "new" }))

    const answers = after.content[0]?.answers ?? []
    expect(answers.find((a) => a.id === "a-1")?.answer).toBe("new")
    expect(answers.find((a) => a.id === "a-2")?.answer).toBe("other")
  })

  it("does not touch a different question's answers", () => {
    const before = page([
      question({ id: "q-1", answers: [answer({ id: "a-1", answer: "old" })] }),
      question({ id: "q-2", answers: [answer({ id: "a-2", answer: "untouched" })] }),
    ])

    const after = patchAnswerUpdated(before, "q-1", answer({ id: "a-1", answer: "new" }))

    expect(after.content.find((q) => q.id === "q-2")?.answers[0]?.answer).toBe("untouched")
  })
})

describe("patchAnswerDeleted", () => {
  it("removes only the matching answer from the matching question", () => {
    const before = page([question({ id: "q-1", answers: [answer({ id: "a-1" }), answer({ id: "a-2" })] })])

    const after = patchAnswerDeleted(before, "q-1", "a-1")

    expect(after.content[0]?.answers.map((a) => a.id)).toEqual(["a-2"])
  })

  it("leaves a question with no matching answer id unchanged", () => {
    const before = page([question({ id: "q-1", answers: [answer({ id: "a-1" })] })])

    const after = patchAnswerDeleted(before, "q-1", "does-not-exist")

    expect(after.content[0]?.answers.map((a) => a.id)).toEqual(["a-1"])
  })
})
