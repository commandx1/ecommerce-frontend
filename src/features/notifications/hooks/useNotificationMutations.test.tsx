import { QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { createTestQueryClient } from "@/test/render"
import { notificationsKeys } from "../lib/notifications-keys"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
} from "./useNotificationMutations"

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    love: vi.fn(),
    loading: vi.fn(),
  },
}))

import { showToast } from "@/components/ui/Toast"

function makeWrapper() {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe("useMarkNotificationRead", () => {
  it("invalidates the notifications cache on success", async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper })

    act(() => {
      result.current.mutate("notif-1")
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: notificationsKeys.all })
  })

  it("shows an error toast on failure", async () => {
    server.use(
      http.patch("*/backend-api/notifications/:id/read", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper })

    act(() => {
      result.current.mutate("notif-1")
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(showToast.error).toHaveBeenCalled()
  })
})

describe("useMarkNotificationUnread", () => {
  it("invalidates the notifications cache on success", async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useMarkNotificationUnread(), { wrapper })

    act(() => {
      result.current.mutate("notif-1")
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: notificationsKeys.all })
  })
})

describe("useMarkAllNotificationsRead", () => {
  beforeEach(() => {
    vi.mocked(showToast.error).mockClear()
  })

  it("invalidates the notifications cache on success", async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: notificationsKeys.all })
  })

  it("shows an error toast on failure", async () => {
    server.use(
      http.patch("*/backend-api/notifications/read-all", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(showToast.error).toHaveBeenCalled()
  })
})
