import { useQuery } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProductAnswerResponse, SellerQuestionsPage } from "@/lib/api/vendor-questions"
import { server } from "@/mocks/server"
import { createQueryWrapper } from "@/test/render"
import { vendorQuestionsCountsOptions, vendorQuestionsListOptions } from "../api/questions-queries"
import { useAnswerMutations } from "./useAnswerMutations"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const LIST_PARAMS = { page: 0, size: 10, filter: "all" as const }

const answer = (overrides: Partial<ProductAnswerResponse> = {}): ProductAnswerResponse => ({
  id: "a-1",
  productQuestionId: "q-1",
  answererUserId: "vendor-1",
  answererName: "Vendor",
  answer: "Original.",
  createdDate: "2026-08-01T09:00:00Z",
  ...overrides,
})

const listPage = (answers: ProductAnswerResponse[] = []): SellerQuestionsPage => ({
  content: [
    {
      id: "q-1",
      productId: "p-1",
      productName: "Composite Kit",
      userId: "buyer-1",
      questionerName: "Jane",
      userProductId: "up-1",
      sellerName: "Acme",
      question: "Does it include tips?",
      createdDate: "2026-08-01T09:00:00Z",
      answers,
    },
  ],
  totalPages: 1,
  totalElements: 1,
  number: 0,
  size: 10,
})

/** Mounts the same combination the page mounts: an active list observer (so gcTime: 0 never
 * evicts it between the fetch and the assertion) plus the counts query and the mutations
 * under test, all sharing one query client - the mutation's cache patches only work when read
 * back through the same client the page would use. */
function useHarness(countsEnabled = true) {
  return {
    list: useQuery(vendorQuestionsListOptions(LIST_PARAMS, true)),
    counts: useQuery(vendorQuestionsCountsOptions(countsEnabled)),
    mutations: useAnswerMutations(LIST_PARAMS),
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("useAnswerMutations", () => {
  it("patches the list cache with the new answer and refetches counts exactly once", async () => {
    let countsCalls = 0
    server.use(
      http.get("*/backend-api/product-questions/seller", () => HttpResponse.json(listPage())),
      http.post("*/backend-api/product-answers", () => HttpResponse.json(answer({ id: "a-new", answer: "Sure." }))),
      http.get("*/backend-api/product-questions/seller/counts", () => {
        countsCalls += 1
        return HttpResponse.json({ total: 1, answered: countsCalls > 1 ? 1 : 0, unanswered: countsCalls > 1 ? 0 : 1 })
      }),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useHarness(), { wrapper })

    await waitFor(() => expect(result.current.list.data).toBeDefined())
    await waitFor(() => expect(countsCalls).toBe(1))

    await act(async () => {
      await result.current.mutations.createAnswer.mutateAsync({ productQuestionId: "q-1", answer: "Sure." })
    })

    await waitFor(() => expect(result.current.list.data?.content[0]?.answers.map((a) => a.id)).toEqual(["a-new"]))
    await waitFor(() => expect(countsCalls).toBe(2))
  })

  it("patches the list cache on update without ever refetching counts", async () => {
    let countsCalls = 0
    server.use(
      http.get("*/backend-api/product-questions/seller", () => HttpResponse.json(listPage([answer()]))),
      http.put("*/backend-api/product-answers/a-1", () => HttpResponse.json(answer({ answer: "Updated." }))),
      http.get("*/backend-api/product-questions/seller/counts", () => {
        countsCalls += 1
        return HttpResponse.json({ total: 1, answered: 1, unanswered: 0 })
      }),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useHarness(), { wrapper })

    await waitFor(() => expect(result.current.list.data).toBeDefined())
    await waitFor(() => expect(countsCalls).toBe(1))

    await act(async () => {
      await result.current.mutations.updateAnswer.mutateAsync({ answerId: "a-1", answer: "Updated." })
    })

    await waitFor(() => expect(result.current.list.data?.content[0]?.answers[0]?.answer).toBe("Updated."))
    // Give any (incorrect) refetch a chance to fire before asserting it never did.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(countsCalls).toBe(1)
  })

  it("patches the list cache on delete and refetches counts exactly once", async () => {
    let countsCalls = 0
    server.use(
      http.get("*/backend-api/product-questions/seller", () => HttpResponse.json(listPage([answer()]))),
      http.delete("*/backend-api/product-answers/a-1", () => new HttpResponse(null, { status: 204 })),
      http.get("*/backend-api/product-questions/seller/counts", () => {
        countsCalls += 1
        return HttpResponse.json({ total: 1, answered: countsCalls > 1 ? 0 : 1, unanswered: countsCalls > 1 ? 1 : 0 })
      }),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useHarness(), { wrapper })

    await waitFor(() => expect(result.current.list.data).toBeDefined())
    await waitFor(() => expect(countsCalls).toBe(1))

    await act(async () => {
      await result.current.mutations.deleteAnswer.mutateAsync({ questionId: "q-1", answerId: "a-1" })
    })

    await waitFor(() => expect(result.current.list.data?.content[0]?.answers).toEqual([]))
    await waitFor(() => expect(countsCalls).toBe(2))
  })

  it("toasts 'Failed to save answer' and leaves the cache untouched when create fails", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () => HttpResponse.json(listPage())),
      http.post("*/backend-api/product-answers", () => new HttpResponse(null, { status: 500 })),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useHarness(false), { wrapper })
    await waitFor(() => expect(result.current.list.data).toBeDefined())
    const before = result.current.list.data

    await act(async () => {
      await result.current.mutations.createAnswer
        .mutateAsync({ productQuestionId: "q-1", answer: "x" })
        .catch(() => undefined)
    })

    expect(toastSpies.error).toHaveBeenCalledWith("Failed to save answer", "Please try again.")
    expect(result.current.list.data).toEqual(before)
  })

  it("toasts 'Failed to delete answer' when delete fails", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () => HttpResponse.json(listPage([answer()]))),
      http.delete("*/backend-api/product-answers/a-1", () => new HttpResponse(null, { status: 500 })),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useHarness(false), { wrapper })
    await waitFor(() => expect(result.current.list.data).toBeDefined())

    await act(async () => {
      await result.current.mutations.deleteAnswer
        .mutateAsync({ questionId: "q-1", answerId: "a-1" })
        .catch(() => undefined)
    })

    expect(toastSpies.error).toHaveBeenCalledWith("Failed to delete answer", "Please try again.")
  })
})
