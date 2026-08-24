import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import type { CreateAnswerPayload, ProductQuestionResponse, UpdateAnswerPayload } from "./vendor-questions"
import { vendorQuestionsAPI } from "./vendor-questions"

function makeQuestion(overrides: Partial<ProductQuestionResponse> = {}): ProductQuestionResponse {
  return {
    id: "question-1",
    productId: "product-1",
    productName: "Nitrile Gloves",
    userId: "buyer-1",
    questionerName: "Jane Doe",
    userProductId: "up-1",
    sellerName: "Acme Dental",
    question: "Are these latex-free?",
    createdDate: "2026-08-01T10:00:00Z",
    answers: [],
    ...overrides,
  }
}

const mockAnswer = {
  id: "answer-1",
  productQuestionId: "question-1",
  answererUserId: "vendor-1",
  answererName: "Acme Dental",
  answer: "Yes, fully latex-free.",
  createdDate: "2026-08-02T10:00:00Z",
}

const mockQuestionsPage = {
  content: [makeQuestion(), makeQuestion({ id: "question-2", answers: [mockAnswer] })],
  totalPages: 2,
  totalElements: 15,
  number: 0,
  size: 10,
}

let capturedListQuery: URLSearchParams | null = null
let capturedCreatePayload: CreateAnswerPayload | null = null
let capturedUpdatePayload: UpdateAnswerPayload | null = null
let capturedDeleteUrl: string | null = null

beforeEach(() => {
  capturedListQuery = null
  capturedCreatePayload = null
  capturedUpdatePayload = null
  capturedDeleteUrl = null

  server.use(
    http.get("*/backend-api/product-questions/seller", ({ request }) => {
      capturedListQuery = new URL(request.url).searchParams
      return HttpResponse.json(mockQuestionsPage)
    }),
    http.get("*/backend-api/product-questions/seller/counts", () =>
      HttpResponse.json({ total: 15, answered: 6, unanswered: 9 }),
    ),
    http.post("*/backend-api/product-answers", async ({ request }) => {
      capturedCreatePayload = (await request.json()) as CreateAnswerPayload
      return HttpResponse.json(mockAnswer)
    }),
    http.put("*/backend-api/product-answers/:id", async ({ request }) => {
      capturedUpdatePayload = (await request.json()) as UpdateAnswerPayload
      return HttpResponse.json({ ...mockAnswer, answer: capturedUpdatePayload.answer })
    }),
    http.delete("*/backend-api/product-answers/:id", ({ request }) => {
      capturedDeleteUrl = request.url
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

describe("vendorQuestionsAPI.getSellerQuestions contract", () => {
  it("defaults to page 0, size 10, no answered filter (0-indexed pagination)", async () => {
    await vendorQuestionsAPI.getSellerQuestions()

    expect(capturedListQuery?.get("page")).toBe("0")
    expect(capturedListQuery?.get("size")).toBe("10")
    expect(capturedListQuery?.has("answered")).toBe(false)
  })

  it('maps filter "answered" to answered=true', async () => {
    await vendorQuestionsAPI.getSellerQuestions(0, 10, "answered")

    expect(capturedListQuery?.get("answered")).toBe("true")
  })

  it('maps filter "unanswered" to answered=false', async () => {
    await vendorQuestionsAPI.getSellerQuestions(0, 10, "unanswered")

    expect(capturedListQuery?.get("answered")).toBe("false")
  })

  it('maps filter "all" to omitting the answered param entirely', async () => {
    await vendorQuestionsAPI.getSellerQuestions(0, 10, "all")

    expect(capturedListQuery?.has("answered")).toBe(false)
  })

  it("returns the typed question page with nested answers", async () => {
    const response = await vendorQuestionsAPI.getSellerQuestions()

    expect(response.content).toHaveLength(2)
    expect(response.content[0]?.answers).toEqual([])
    expect(response.content[1]?.answers[0]?.answer).toBe("Yes, fully latex-free.")
    expect(response.totalElements).toBe(15)
  })

  it("tolerates an empty question list", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () =>
        HttpResponse.json({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 }),
      ),
    )

    const response = await vendorQuestionsAPI.getSellerQuestions()

    expect(response.content).toEqual([])
  })

  it("tolerates a question with a null productName and createdDate", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () =>
        HttpResponse.json({
          content: [makeQuestion({ productName: null, createdDate: null })],
          totalPages: 1,
          totalElements: 1,
          number: 0,
          size: 10,
        }),
      ),
    )

    const response = await vendorQuestionsAPI.getSellerQuestions()

    expect(response.content[0]?.productName).toBeNull()
    expect(response.content[0]?.createdDate).toBeNull()
  })

  it("rejects with a 401 and marks the error auth-handled", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    )

    const error = await vendorQuestionsAPI.getSellerQuestions().catch((e) => e)

    expect(error.response?.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })
})

describe("vendorQuestionsAPI.getSellerCounts contract", () => {
  it("returns the typed counts", async () => {
    const counts = await vendorQuestionsAPI.getSellerCounts()

    expect(counts).toEqual({ total: 15, answered: 6, unanswered: 9 })
  })

  it("tolerates all-zero counts for a vendor with no questions", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller/counts", () =>
        HttpResponse.json({ total: 0, answered: 0, unanswered: 0 }),
      ),
    )

    const counts = await vendorQuestionsAPI.getSellerCounts()

    expect(counts).toEqual({ total: 0, answered: 0, unanswered: 0 })
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller/counts", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    )

    await expect(vendorQuestionsAPI.getSellerCounts()).rejects.toThrow(/500/)
  })
})

describe("vendorQuestionsAPI.createAnswer contract", () => {
  it("sends the exact create-answer payload shape", async () => {
    const payload: CreateAnswerPayload = { productQuestionId: "question-1", answer: "Yes, fully latex-free." }

    const response = await vendorQuestionsAPI.createAnswer(payload)

    expect(capturedCreatePayload).toEqual(payload)
    expect(response.answer).toBe("Yes, fully latex-free.")
  })

  it("rejects with a 409 when the question was already answered", async () => {
    server.use(
      http.post("*/backend-api/product-answers", () =>
        HttpResponse.json({ message: "Question already has an answer" }, { status: 409 }),
      ),
    )

    await expect(
      vendorQuestionsAPI.createAnswer({ productQuestionId: "question-1", answer: "Duplicate" }),
    ).rejects.toThrow(/409/)
  })

  it("rejects with a 400 for an empty answer body", async () => {
    server.use(
      http.post("*/backend-api/product-answers", () =>
        HttpResponse.json({ message: "Answer cannot be empty" }, { status: 400 }),
      ),
    )

    await expect(vendorQuestionsAPI.createAnswer({ productQuestionId: "question-1", answer: "" })).rejects.toThrow(
      /400/,
    )
  })
})

describe("vendorQuestionsAPI.updateAnswer contract", () => {
  it("sends the exact update payload shape and returns the updated answer", async () => {
    const payload: UpdateAnswerPayload = { answer: "Updated: yes, fully latex-free." }

    const response = await vendorQuestionsAPI.updateAnswer("answer-1", payload)

    expect(capturedUpdatePayload).toEqual(payload)
    expect(response.answer).toBe("Updated: yes, fully latex-free.")
  })

  it("rejects with a 403 when updating another vendor's answer", async () => {
    server.use(
      http.put("*/backend-api/product-answers/:id", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })),
    )

    const error = await vendorQuestionsAPI.updateAnswer("someone-elses-answer", { answer: "x" }).catch((e) => e)

    expect(error.response?.status).toBe(403)
    expect(error.authHandled).toBeFalsy()
  })
})

describe("vendorQuestionsAPI.deleteAnswer contract", () => {
  it("calls DELETE with the answer id in the path", async () => {
    await vendorQuestionsAPI.deleteAnswer("answer-1")

    expect(capturedDeleteUrl).toContain("/product-answers/answer-1")
  })

  it("rejects with a 404 when the answer no longer exists", async () => {
    server.use(
      http.delete("*/backend-api/product-answers/:id", () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    )

    await expect(vendorQuestionsAPI.deleteAnswer("missing")).rejects.toThrow(/404/)
  })

  it("rejects on a network failure", async () => {
    server.use(http.delete("*/backend-api/product-answers/:id", () => HttpResponse.error()))

    await expect(vendorQuestionsAPI.deleteAnswer("answer-1")).rejects.toThrow()
  })
})
