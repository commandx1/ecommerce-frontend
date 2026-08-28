import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * `ProductQuestionResponse`/`ProductAnswerResponse` (src/lib/api/vendor-questions.ts)
 * have no exported builder in src/test/factories/** (unlike most other
 * mocks/*.mocks.ts files - see vendor.mocks.ts's header comment for that
 * convention), so this file defines its own. Field names/types verified
 * against the backend DTOs (source of truth):
 * ecommerce-api/.../product/dto/{ProductQuestionResponse,ProductAnswerResponse}.java
 * and the controllers at product/controller/{ProductQuestionController,ProductAnswerController}.java
 * (`GET /api/product-questions/seller`, `GET /api/product-questions/seller/counts`,
 * `POST /api/product-answers`, `PUT /api/product-answers/{id}`, `DELETE /api/product-answers/{id}`).
 */

export interface MockProductAnswer {
  id: string
  productQuestionId: string
  answererUserId: string
  answererName: string
  answer: string
  createdDate: string | null
}

export interface MockProductQuestion {
  id: string
  productId: string
  productName: string | null
  userId: string
  questionerName: string
  userProductId: string
  sellerName: string
  question: string
  createdDate: string | null
  answers: MockProductAnswer[]
}

export interface MockQuestionsPage {
  content: MockProductQuestion[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export interface MockSellerQuestionCounts {
  total: number
  answered: number
  unanswered: number
}

let questionSeq = 0
let answerSeq = 0

export function makeProductAnswer(overrides: Partial<MockProductAnswer> = {}): MockProductAnswer {
  answerSeq += 1
  return {
    id: `answer-${answerSeq}`,
    productQuestionId: "question-1",
    // Matches the default id `makeAccountUser()` gives the authenticated
    // vendor in tests/e2e/fixtures/auth-cookie.ts, so "answer belongs to the
    // current vendor" checks pass by default without every caller overriding it.
    answererUserId: "user-1",
    answererName: "Serhat Belen",
    answer: "Yes, it's in stock and ships within 2 business days.",
    createdDate: "2026-08-20T10:00:00",
    ...overrides,
  }
}

export function makeProductQuestion(overrides: Partial<MockProductQuestion> = {}): MockProductQuestion {
  questionSeq += 1
  return {
    id: `question-${questionSeq}`,
    productId: "product-1",
    productName: "Dental Composite Kit",
    userId: "buyer-1",
    questionerName: "Alex Buyer",
    userProductId: "user-product-1",
    sellerName: "Serhat Belen",
    question: "Does this come with a warranty?",
    createdDate: "2026-08-19T09:00:00",
    answers: [],
    ...overrides,
  }
}

export function makeQuestionsPage(overrides: Partial<MockQuestionsPage> = {}): MockQuestionsPage {
  const content = overrides.content ?? [makeProductQuestion()]
  return {
    content,
    totalPages: 1,
    totalElements: content.length,
    number: 0,
    size: 10,
    ...overrides,
  }
}

export function makeSellerQuestionCounts(overrides: Partial<MockSellerQuestionCounts> = {}): MockSellerQuestionCounts {
  return { total: 1, answered: 0, unanswered: 1, ...overrides }
}

export function registerVendorQuestionsMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/product-questions/seller", () => ({ body: makeQuestionsPage() }))
  apiMock.on("GET", "/backend-api/product-questions/seller/counts", () => ({ body: makeSellerQuestionCounts() }))
  apiMock.on("POST", "/backend-api/product-answers", () => ({ body: makeProductAnswer() }))
  apiMock.on("PUT", "/backend-api/product-answers/:answerId", ({ params }) => ({
    body: makeProductAnswer({ id: params.answerId }),
  }))
  apiMock.on("DELETE", "/backend-api/product-answers/:answerId", () => ({ status: 204 }))
}
