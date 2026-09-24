import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useVendorQuestionsPage } from "./useVendorQuestionsPage"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

beforeEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("useVendorQuestionsPage", () => {
  it("resolves the list and counts once both requests succeed", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () =>
        HttpResponse.json({
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
              answers: [],
            },
          ],
          totalPages: 1,
          totalElements: 1,
          number: 0,
          size: 10,
        }),
      ),
      http.get("*/backend-api/product-questions/seller/counts", () =>
        HttpResponse.json({ total: 1, answered: 0, unanswered: 1 }),
      ),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorQuestionsPage(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.questions).toHaveLength(1)
    expect(result.current.counts).toEqual({ total: 1, answered: 0, unanswered: 1 })
  })

  it.each([
    ["content is missing entirely", { totalPages: 1, totalElements: 1, number: 0, size: 10 }],
    ["content is null", { content: null, totalPages: 1, totalElements: 1, number: 0, size: 10 }],
    [
      "content is a non-array object",
      { content: { 0: { id: "q-1" } }, totalPages: 1, totalElements: 1, number: 0, size: 10 },
    ],
  ])("normalizes a malformed 200 body (%s) into an empty list instead of crashing", async (_label, body) => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () => HttpResponse.json(body)),
      http.get("*/backend-api/product-questions/seller/counts", () =>
        HttpResponse.json({ total: 0, answered: 0, unanswered: 0 }),
      ),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorQuestionsPage(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.questions).toEqual([])
  })

  it("renders a question whose own `answers` field is missing instead of crashing", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () =>
        HttpResponse.json({
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
              // answers omitted entirely
            },
          ],
          totalPages: 1,
          totalElements: 1,
          number: 0,
          size: 10,
        }),
      ),
      http.get("*/backend-api/product-questions/seller/counts", () =>
        HttpResponse.json({ total: 1, answered: 0, unanswered: 1 }),
      ),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorQuestionsPage(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.questions[0]?.answers).toEqual([])
  })

  it("toasts 'Failed to load questions' exactly once when the list request fails, and shows empty rows", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () => new HttpResponse(null, { status: 500 })),
      http.get("*/backend-api/product-questions/seller/counts", () =>
        HttpResponse.json({ total: 0, answered: 0, unanswered: 0 }),
      ),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorQuestionsPage(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.questions).toEqual([])
    expect(toastSpies.error).toHaveBeenCalledTimes(1)
    expect(toastSpies.error).toHaveBeenCalledWith("Failed to load questions", "Please refresh the page.")
  })

  it("keeps counts failures silent - no toast, counts just stays null", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () =>
        HttpResponse.json({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 }),
      ),
      http.get("*/backend-api/product-questions/seller/counts", () => new HttpResponse(null, { status: 500 })),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorQuestionsPage(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.counts).toBeNull()
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("resets to the first page when the filter changes", async () => {
    server.use(
      http.get("*/backend-api/product-questions/seller", () =>
        HttpResponse.json({ content: [], totalPages: 3, totalElements: 25, number: 0, size: 10 }),
      ),
      http.get("*/backend-api/product-questions/seller/counts", () =>
        HttpResponse.json({ total: 25, answered: 10, unanswered: 15 }),
      ),
    )
    const { wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useVendorQuestionsPage(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setCurrentPage(2))
    expect(result.current.currentPage).toBe(2)

    act(() => result.current.handleFilterChange("unanswered"))
    expect(result.current.currentPage).toBe(0)
    expect(result.current.activeFilter).toBe("unanswered")
  })

  it("does not call the API when the vendor is not authenticated", () => {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    const requested = vi.fn()
    server.use(
      http.get("*/backend-api/product-questions/seller", () => {
        requested()
        return HttpResponse.json({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 })
      }),
    )
    const { wrapper } = createQueryWrapper()

    renderHook(() => useVendorQuestionsPage(), { wrapper })

    expect(requested).not.toHaveBeenCalled()
  })
})
