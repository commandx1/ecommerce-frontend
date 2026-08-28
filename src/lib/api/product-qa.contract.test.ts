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

  // BFF gate (F40): POST /api/product-questions (src/app/api/product-questions/route.ts, line
  // ~7-9) returns 401 immediately when Authorization is missing, without calling upstream.
  // `submitProductQuestion` sends no header at all when accessToken is null, so this is the real
  // outcome, not a hypothetical one.
  it("rejects with 401 (no upstream call) when accessToken is null", async () => {
    let upstreamCalled = false
    server.use(
      http.post("*/api/product-questions", ({ request }) => {
        if (!request.headers.get("authorization")) {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        upstreamCalled = true
        return new HttpResponse(null, { status: 200 })
      }),
    )

    const error = await submitProductQuestion({
      accessToken: null,
      productId: "p-1",
      userProductId: "up-1",
      question: "Anonymous question",
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(401)
    expect(upstreamCalled).toBe(false)
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

  // BFF gate (F40): POST /api/product-answers (src/app/api/product-answers/route.ts, line ~7-9)
  // returns 401 immediately when Authorization is missing, without calling upstream.
  it("rejects with 401 (no upstream call) when accessToken is null", async () => {
    let upstreamCalled = false
    server.use(
      http.post("*/api/product-answers", ({ request }) => {
        if (!request.headers.get("authorization")) {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        upstreamCalled = true
        return new HttpResponse(null, { status: 200 })
      }),
    )

    const error = await submitProductAnswer({ accessToken: null, productQuestionId: "q-1", answer: "Yes" }).catch(
      (e) => e,
    )

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(401)
    expect(upstreamCalled).toBe(false)
  })

  // Backend: ProductAnswerServiceImpl.create (product/service/ProductAnswerServiceImpl.java,
  // line ~29-39) has NO "already answered" duplicate check at all - a seller can post multiple
  // answers to the same question with no conflict. There is no 409 path in this method; the one
  // realistic non-2xx path (besides validation/not-found) is
  // `throw new AccessDeniedException("Only the seller of the product can answer")` when the
  // caller isn't the listing's seller. AccessDeniedException (product/exception, not Spring
  // Security's) extends RuntimeException directly and isn't registered in
  // GlobalExceptionHandler.java, so it falls to the RuntimeException catch-all - 400, not 403 or
  // 409.
  it("rejects on 400 when the caller isn't the seller of the related product", async () => {
    server.use(
      http.post("*/api/product-answers", () =>
        HttpResponse.json({ message: "Only the seller of the product can answer" }, { status: 400 }),
      ),
    )

    await expect(submitProductAnswer({ accessToken: "t", productQuestionId: "q-1", answer: "A" })).rejects.toThrow(
      "Only the seller of the product can answer",
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
