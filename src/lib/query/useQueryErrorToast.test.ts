import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { type ErrorToastableQuery, useQueryErrorToast } from "./useQueryErrorToast"

function query(overrides: Partial<ErrorToastableQuery> = {}): ErrorToastableQuery {
  return { isError: false, error: null, errorUpdatedAt: 0, ...overrides }
}

describe("useQueryErrorToast", () => {
  it("does not call onError while the query has not failed", () => {
    const onError = vi.fn()
    renderHook(() => useQueryErrorToast(query({ isError: false }), onError))

    expect(onError).not.toHaveBeenCalled()
  })

  it("calls onError once when the query fails", () => {
    const onError = vi.fn()
    renderHook(() => useQueryErrorToast(query({ isError: true, error: new Error("boom"), errorUpdatedAt: 1 }), onError))

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it("does not re-toast on a rerender with the same errorUpdatedAt", () => {
    const onError = vi.fn()
    const { rerender } = renderHook(({ q }: { q: ErrorToastableQuery }) => useQueryErrorToast(q, onError), {
      initialProps: { q: query({ isError: true, error: new Error("boom"), errorUpdatedAt: 1 }) },
    })
    expect(onError).toHaveBeenCalledTimes(1)

    // Same errorUpdatedAt, e.g. an unrelated parent re-render - must not toast again.
    rerender({ q: query({ isError: true, error: new Error("boom"), errorUpdatedAt: 1 }) })

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it("toasts again when a new, distinct failure lands (errorUpdatedAt changes)", () => {
    const onError = vi.fn()
    const { rerender } = renderHook(({ q }: { q: ErrorToastableQuery }) => useQueryErrorToast(q, onError), {
      initialProps: { q: query({ isError: true, error: new Error("boom"), errorUpdatedAt: 1 }) },
    })
    expect(onError).toHaveBeenCalledTimes(1)

    rerender({ q: query({ isError: true, error: new Error("boom again"), errorUpdatedAt: 2 }) })

    expect(onError).toHaveBeenCalledTimes(2)
  })

  it("stays silent on an auth-handled error", () => {
    const onError = vi.fn()
    const authHandledError = Object.assign(new Error("expired"), { authHandled: true })
    renderHook(() => useQueryErrorToast(query({ isError: true, error: authHandledError, errorUpdatedAt: 1 }), onError))

    expect(onError).not.toHaveBeenCalled()
  })

  it("a defensive isError:false guard stays silent even if errorUpdatedAt still changes", () => {
    // Belt-and-braces: `errorUpdatedAt` is what triggers the effect, but `isError` is what
    // decides whether to toast, in case a future query source ever bumps the timestamp without
    // an active error.
    const onError = vi.fn()
    const { rerender } = renderHook(({ q }: { q: ErrorToastableQuery }) => useQueryErrorToast(q, onError), {
      initialProps: { q: query({ isError: true, error: new Error("boom"), errorUpdatedAt: 1 }) },
    })
    expect(onError).toHaveBeenCalledTimes(1)
    onError.mockClear()

    rerender({ q: query({ isError: false, error: null, errorUpdatedAt: 2 }) })

    expect(onError).not.toHaveBeenCalled()
  })
})
