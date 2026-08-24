import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { submitProductAnswer, submitProductQuestion } from "./product-qa"
import { ApiRequestError } from "./request"

let capturedQuestionBody: Record<string, unknown> | null = null
let capturedQuestionHeaders: Headers | null = null
let capturedAnswerBody: Record<string, unknown> | null = null
let capturedAnswerHeaders: Headers | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedQuestionBody = null
  capturedQuestionHeaders = null
  capturedAnswerBody = null
  capturedAnswerHeaders = null

  server.use(
    http.post("*/api/product-questions", async ({ request }) => {
      capturedQuestionBody = (await request.json()) as Record<string, unknown>
      capturedQuestionHeaders = request.headers
      return new HttpResponse(null, { status: 200 })
    }),
    http.post("*/api/product-answers", async ({ request }) => {
      capturedAnswerBody = (await request.json()) as Record<string, unknown>
      capturedAnswerHeaders = request.headers
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

describe("submitProductQuestion contract", () => {
  it("sends the exact question payload shape and the bearer token", async () => {
    await submitProductQuestion({
      accessToken: "token-123",
      productId: "p-1",
      userProductId: "up-1",
      question: "Does this fit a size 5 tray?",
    })

    expect(capturedQuestionBody).toEqual({
      productId: "p-1",
      userProductId: "up-1",
      question: "Does this fit a size 5 tray?",
    })
    expect(capturedQuestionHeaders?.get("authorization")).toBe("Bearer token-123")
  })

  it("omits the Authorization header when accessToken is null", async () => {
    await submitProductQuestion({
      accessToken: null,
      productId: "p-1",
      userProductId: "up-1",
      question: "Anonymous question",
    })

    expect(capturedQuestionHeaders?.get("authorization")).toBeNull()
  })

  it("tolerates an empty-string question", async () => {
    await submitProductQuestion({
      accessToken: "token-123",
      productId: "p-1",
      userProductId: "up-1",
      question: "",
    })

    expect(capturedQuestionBody).toEqual({
      productId: "p-1",
      userProductId: "up-1",
      question: "",
    })
  })

  it("surfaces the backend message and authHandled flag on 401", async () => {
    server.use(
      http.post("*/api/product-questions", () => HttpResponse.json({ message: "Session expired" }, { status: 401 })),
    )

    const error = await submitProductQuestion({
      accessToken: "token-123",
      productId: "p-1",
      userProductId: "up-1",
      question: "Q",
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(401)
    expect((error as ApiRequestError).authHandled).toBe(true)
    expect((error as ApiRequestError).message).toBe("Session expired")
  })

  it("rejects with the fallback message on 403", async () => {
    server.use(http.post("*/api/product-questions", () => new HttpResponse(null, { status: 403 })))

    const error = await submitProductQuestion({
      accessToken: "token-123",
      productId: "p-1",
      userProductId: "up-1",
      question: "Q",
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(403)
    expect((error as ApiRequestError).authHandled).toBe(false)
    expect((error as ApiRequestError).message).toBe("Failed to submit question")
  })

  it("rejects on 404", async () => {
    server.use(
      http.post("*/api/product-questions", () => HttpResponse.json({ message: "Product not found" }, { status: 404 })),
    )

    await expect(
      submitProductQuestion({ accessToken: "t", productId: "missing", userProductId: "up-1", question: "Q" }),
    ).rejects.toThrow("Product not found")
  })

  it("rejects on 500", async () => {
    server.use(http.post("*/api/product-questions", () => new HttpResponse(null, { status: 500 })))

    await expect(
      submitProductQuestion({ accessToken: "t", productId: "p-1", userProductId: "up-1", question: "Q" }),
    ).rejects.toThrow("Failed to submit question")
  })

  it("rejects on network failure", async () => {
    server.use(http.post("*/api/product-questions", () => HttpResponse.error()))

    await expect(
      submitProductQuestion({ accessToken: "t", productId: "p-1", userProductId: "up-1", question: "Q" }),
    ).rejects.toThrow()
  })
})

describe("submitProductAnswer contract", () => {
  it("sends the exact answer payload shape and the bearer token", async () => {
    await submitProductAnswer({
      accessToken: "token-456",
      productQuestionId: "q-1",
      answer: "Yes, it fits.",
    })

    expect(capturedAnswerBody).toEqual({
      productQuestionId: "q-1",
      answer: "Yes, it fits.",
    })
    expect(capturedAnswerHeaders?.get("authorization")).toBe("Bearer token-456")
  })

  it("omits the Authorization header when accessToken is null", async () => {
    await submitProductAnswer({ accessToken: null, productQuestionId: "q-1", answer: "Yes" })

    expect(capturedAnswerHeaders?.get("authorization")).toBeNull()
  })

  it("rejects with 409 conflict (question already answered by this vendor)", async () => {
    server.use(
      http.post("*/api/product-answers", () =>
        HttpResponse.json({ message: "Question already answered" }, { status: 409 }),
      ),
    )

    await expect(submitProductAnswer({ accessToken: "t", productQuestionId: "q-1", answer: "A" })).rejects.toThrow(
      "Question already answered",
    )
  })

  it("rejects on 400 validation error", async () => {
    server.use(
      http.post("*/api/product-answers", () => HttpResponse.json({ error: "Answer is required" }, { status: 400 })),
    )

    await expect(submitProductAnswer({ accessToken: "t", productQuestionId: "q-1", answer: "" })).rejects.toThrow(
      "Answer is required",
    )
  })
})
